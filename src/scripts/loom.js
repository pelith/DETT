class Loom {
  constructor(currentProvider = null) {
    this.web3Provider = currentProvider
    this.chainId = 'extdev-plasma-us1'
    this.writeUrl = 'ws://extdev-plasma-us1.dappchains.com/websocket'
    this.readUrl = 'ws://extdev-plasma-us1.dappchains.com/queryws'
    this.ethAddr = null
    this.client = null
    this.loomProvider = null
    this.publicKey = null
    this.loomAddr = null
  }


  async init() {
    if (!window.loom) return console.error("Can't find Loom.")
    this.client = new loom.Client(this.chainId, this.writeUrl, this.readUrl)
    const privateKey = loom.CryptoUtils.generatePrivateKey()
    this.publicKey = loom.CryptoUtils.publicKeyFromPrivateKey(privateKey)
    this.web3Provider.isMetaMask = true
    const ethersProvider = new ethers.providers.Web3Provider(this.web3Provider)
    const signer = ethersProvider.getSigner()
    this.ethAddr = await signer.getAddress()
    const to = new loom.Address('eth', loom.LocalAddress.fromHexString(this.ethAddr))
    const from = new loom.Address(this.client.chainId, loom.LocalAddress.fromPublicKey(this.publicKey))
    const addressMapper = await loom.Contracts.AddressMapper.createAsync(this.client, from)

    if (await addressMapper.hasMappingAsync(to)) {
      const mapping = await addressMapper.getMappingAsync(to)
      this.loomAddr = mapping.to.local.toString()
      console.log('Mapping already exists.')
    } else {
      console.log('Adding a new mapping.')
      const ethersSigner = new loom.EthersSigner(signer)
      await addressMapper.addIdentityMappingAsync(from, to, ethersSigner)
    }

    this.loomProvider = new loom.LoomProvider(this.client, privateKey)
    this.loomProvider.callerChainId = 'eth'
    this.loomProvider.setMiddlewaresForAddress(to.local.toString(), [
      new loom.NonceTxMiddleware(to, this.client),
      new loom.SignedEthTxMiddleware(signer)
    ])

    return true
  }

  async getMapAddr(ethAddr) {
    const to = new loom.Address('eth', loom.LocalAddress.fromHexString(ethAddr))
    const addressMapper = await loom.Contracts.AddressMapper.createAsync(this.client, to)
    if (await addressMapper.hasMappingAsync(to)) {
      const mapping = await addressMapper.getMappingAsync(to)
      return mapping.to.local.toString()
    }

    return null
  }
}

export default Loom