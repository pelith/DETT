
class LoomProvider {
  /**
   * Constructs a new client to read & write data from/to a Loom DAppChain via web sockets.
   * @param chainId DAppChain identifier.
   * @param writeUrl Host & port to send txs, specified as "<protocol>://<host>:<port>".
   * @param readUrl Host & port of the DAppChain read/query interface, this should only be provided
   *                if it's not the same as `writeUrl`.
   */
  constructor({chainId, writeUrl, readUrl, libraryName = null, web3Api = null}) {
    if (!window.loom) return console.warn('Loom Lib is not exist')
    if (!window.ethers) return console.warn('Ethers Lib is not exist')

    this.chainId = chainId
    this.writeUrl = loom.createJSONRPCClient({ protocols: [{ url: writeUrl }] })
    this.readUrl = loom.createJSONRPCClient({ protocols: [{ url: readUrl }] })
    this.client = new loom.Client(this.chainId, this.writeUrl, this.readUrl)

    this._libraryName = libraryName
    this.web3Api = web3Api

    this.loomProvider = null
  }

  get library() {
    const providerToInject =
      this.loomProvider &&
      (() => {
        switch (this._libraryName) {
          case 'ethers.js':
            const ethers = this.web3Api
            return new ethers.providers.Web3Provider(this.loomProvider)
          case 'web3.js':
            const Web3 = this.web3Api
            return new Web3(this.loomProvider)
          case null:
            return this.loomProvider
        }
      })()
    return providerToInject
  }

  async setEthereumWallet(provider) {
    // loom key
    const privateKey = loom.CryptoUtils.generatePrivateKey()
    const publicKey = loom.CryptoUtils.publicKeyFromPrivateKey(privateKey)

    // eth signer
    const ethersProvider = new ethers.providers.Web3Provider(provider)
    const signer = ethersProvider.getSigner()
    const ethAddr = await signer.getAddress()

    const ownerEthAddr = new loom.Address('eth', loom.LocalAddress.fromHexString(ethAddr))
    const ownerLoomAddr = new loom.Address(this.chainId, loom.LocalAddress.fromPublicKey(publicKey))
    this.client.txMiddleware = loom.createDefaultTxMiddleware(this.client, privateKey)
    const addressMapper = await loom.Contracts.AddressMapper.createAsync(this.client, ownerLoomAddr)
    if (await this.hasMapping(addressMapper, ownerEthAddr)) {
      const mapping = await addressMapper.getMappingAsync(ownerEthAddr)
      const loomAddr = mapping.to.local.toString()
      console.log(`Already mapped to ${loomAddr}.`)
    } else {
      console.log('Adding a new mapping.')
      const ethersSigner = new loom.EthersSigner(signer)
      await addressMapper.addIdentityMappingAsync(ownerLoomAddr, ownerEthAddr, ethersSigner)
      console.log(`Mapped ${ownerEthAddr} to ${ownerLoomAddr}`)
    }

    this.loomProvider = new loom.LoomProvider(this.client, privateKey)
    this.loomProvider.callerChainId = 'eth'
    this.loomProvider.setMiddlewaresForAddress(ownerEthAddr.local.toString(), [
      new loom.NonceTxMiddleware(ownerEthAddr, this.client),
      new loom.SignedEthTxMiddleware(signer)
    ])
  }

  async hasMapping(addressMapper, from) {
    try {
      return await addressMapper.hasMappingAsync(from)
    } catch {
      return false
    }
  }

  // dirty hook
  setNetworkOnly(_privateKey = null) {
    const privateKey = _privateKey ? _privateKey : loom.CryptoUtils.generatePrivateKey()
    this.loomProvider = new loom.LoomProvider(this.client, privateKey)
  }

  async getMappingAddress(address, chainId = this.chainId) {
    const to = new loom.Address(chainId, loom.LocalAddress.fromHexString(address))
    const addressMapper = await loom.Contracts.AddressMapper.createAsync(this.client, to)
    if (await this.hasMapping(addressMapper, to)) {
      const mapping = await addressMapper.getMappingAsync(to)
      return mapping.to.local.toString()
    }

    return null
  }
}

export default LoomProvider
