import { derivePath } from 'ed25519-hd-key'
import { mnemonicToSeedSync } from 'bip39'
import { sha256 } from 'js-sha256'

class Loom {
  constructor(currentProvider = null) {
    this.web3Provider = currentProvider
    this.chainId = 'extdev-plasma-us1'
    this.writeUrl = 'wss://extdev-plasma-us1.dappchains.com/websocket'
    this.readUrl = 'wss://extdev-plasma-us1.dappchains.com/queryws'
    this.ethAddr = null
    this.client = null
    this.loomProvider = null
    this.publicKey = null
    this.loomAddr = null
  }

  default() {
    const privateKey = loom.CryptoUtils.generatePrivateKey()
    this.client = new loom.Client(this.chainId, this.writeUrl, this.readUrl)
    this.loomProvider = new loom.LoomProvider(this.client, privateKey)

    return true
  }

  async init() {
    this.client = new loom.Client(this.chainId, this.writeUrl, this.readUrl)
    const privateKey = loom.CryptoUtils.generatePrivateKey()
    this.publicKey = loom.CryptoUtils.publicKeyFromPrivateKey(privateKey)
    const ethersProvider = new ethers.providers.Web3Provider(this.web3Provider)
    const signer = ethersProvider.getSigner()
    try {
      this.ethAddr = await signer.getAddress()
    } catch(err) {
      console.log(err)
      return false
    }
    const ownerEthAddr = new loom.Address('eth', loom.LocalAddress.fromHexString(this.ethAddr))
    const ownerLoomAddr = new loom.Address(this.chainId, loom.LocalAddress.fromPublicKey(this.publicKey))
    this.client.txMiddleware = loom.createDefaultTxMiddleware(this.client, privateKey)
    const addressMapper = await loom.Contracts.AddressMapper.createAsync(this.client, ownerLoomAddr)

    if (await addressMapper.hasMappingAsync(ownerEthAddr)) {
      const mapping = await addressMapper.getMappingAsync(ownerEthAddr)
      this.loomAddr = mapping.to.local.toString()
      console.log(`Already mapped to ${this.loomAddr}.`)
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

    return true
  }

  async mapHdWallet(web3, newWallet, seedphrase) {
    this.ethAddr = newWallet.getAddressString()
    const account = web3.eth.accounts.privateKeyToAccount(`0x${newWallet.getPrivateKey().toString('hex')}`)
    web3.eth.accounts.wallet.add(account)
    const signer = new loom.OfflineWeb3Signer(web3, account)
    const ownerEthAddr = new loom.Address('eth', loom.LocalAddress.fromHexString(this.ethAddr))

    const seed = mnemonicToSeedSync(seedphrase)
    const privateKey = loom.CryptoUtils.generatePrivateKeyFromSeed(new Uint8Array(sha256.array(seed)))
    this.publicKey = loom.CryptoUtils.publicKeyFromPrivateKey(privateKey)
    const ownerLoomAddr = new loom.Address(this.chainId, loom.LocalAddress.fromPublicKey(this.publicKey))
    this.client.txMiddleware = loom.createDefaultTxMiddleware(this.client, privateKey)
    const addressMapper = await loom.Contracts.AddressMapper.createAsync(this.client, ownerLoomAddr)

    if (await addressMapper.hasMappingAsync(ownerEthAddr)) {
      const mapping = await addressMapper.getMappingAsync(ownerEthAddr)
      this.loomAddr = mapping.to.local.toString()
      console.log(`Already mapped to ${this.loomAddr}.`)
    } else {
      console.log('Adding a new mapping.')
      await addressMapper.addIdentityMappingAsync(ownerLoomAddr, ownerEthAddr, signer)
      console.log(`Mapped ${ownerEthAddr} to ${ownerLoomAddr}`)
    }

    this.client = new loom.Client(this.chainId, this.writeUrl, this.readUrl)
    this.loomProvider = new loom.LoomProvider(this.client, privateKey)
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

  async getOrigAddr(loomAddr) {
    const to = new loom.Address(this.chainId, loom.LocalAddress.fromHexString(loomAddr))
    const addressMapper = await loom.Contracts.AddressMapper.createAsync(this.client, to)
    if (await addressMapper.hasMappingAsync(to)) {
      const mapping = await addressMapper.getMappingAsync(to)
      return mapping.to.local.toString()
    }

    return null
  }
}

export default Loom