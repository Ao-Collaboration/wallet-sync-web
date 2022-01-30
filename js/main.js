document.addEventListener('DOMContentLoaded', () => {
	// Unpkg imports
	const Web3Modal = window.Web3Modal.default
	const WalletConnectProvider = window.WalletConnectProvider.default

	let provider

	const providerOptions = {
		walletconnect: {
			package: WalletConnectProvider,
			options: {
				infuraId: '240248d1c65143c082ae6b411905d45a',
			},
		},
	}

	let web3Modal = new Web3Modal({
		cacheProvider: false,
		providerOptions,
		disableInjectedProvider: false,
	})

	// Update message
	function renderMessage(message) {
		let messageEl = document.getElementById('message')
		messageEl.innerHTML = message
	}
	// Remove message
	function clearMessage() {
		return renderMessage('')
	}
	// Update message with error
	function renderError(err) {
		console.log(err)
		console.log(Object.keys(err))
		let message = err
		if (err.code && err.reason) {
			message = `${err.code}: ${err.reason}`
		} else if (err.code && err.message) {
			message = `${err.code}: ${err.message}`
		}
		message = `<code class="error">${message}</code>`
		return renderMessage(message)
	}

	// Get the query params
	let username, address, nonce
	const qs = window.location.search.substring(1)
	qs.split('&').forEach(q => {
		const [k, v] = q.split('=')
		if (k === 'username') {
			username = v
		} else if (k === 'nonce') {
			nonce = v
		} else if (k === 'address') {
			document.getElementById('address').innerText = v
			address = v.toLowerCase()
		}
	})
	if (!username || !address || !nonce) {
		console.log('Missing query params')
		return renderMessage('Invalid link! Please check your link and try again.')
	}

	// Show first section
	document.getElementById('connectFlex').classList.remove('gone')
	clearMessage()

	// Connect button
	const connectBtn = document.getElementById('connectBtn')
	connectBtn.addEventListener('click', async () => {
		await window.Web3Modal.removeLocal('walletconnect')
		try {
			provider = await web3Modal.connect()
			provider = new ethers.providers.Web3Provider(provider)
		} catch (err) {
			const msg = 'Could not get a wallet connection'
			console.log(msg, err)
			return renderError(msg)
		}
		// Show next section
		clearMessage()
		document.getElementById('connectFlex').classList.add('gone')
		document.getElementById('signFlex').classList.remove('gone')
	})

	// Verify button
	const signButton = document.getElementById('sign')
	signButton.addEventListener('click', async () => {
		const msg = `Sign this message to prove ${username} owns the address: ${address}\n\nCode: ${nonce}`
		let signature
		try {
			signature = await provider.send('personal_sign', [
				ethers.utils.hexlify(ethers.utils.toUtf8Bytes(msg)),
				address,
			])
		} catch (err) {
			return renderError(err)
		}
		const signingAddr = ethers.utils.verifyMessage(msg, signature)
		if (signingAddr.toLowerCase() !== address) {
			console.log(`Expected address: ${address}`)
			console.log(`Got address: ${signingAddr}`)
			return renderError('Please sign the request with the correct address')
		}
		// Update signature and show
		clearMessage()
		document.getElementById('signature').innerText = signature
		document.getElementById('signFlex').classList.add('gone')
		document.getElementById('thanksFlex').classList.remove('gone')
	})

})
