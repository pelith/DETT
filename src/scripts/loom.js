import { derivePath } from 'ed25519-hd-key'
import { mnemonicToSeedSync } from 'bip39'
import { sha256 } from 'js-sha256'
let loom = null

class Loom {
  constructor(_loom, currentProvider = null) {
    loom = _loom
    this.web3Provider = currentProvider
    this.chainId = 'extdev-plasma-us1'

    this.chainId = 'default'
    this.writeUrl = loom.createJSONRPCClient({ protocols: [{ url: 'https://loom-basechain.xxxx.nctu.me/rpc' }] })
    this.readUrl = loom.createJSONRPCClient({ protocols: [{ url: 'https://loom-basechain.xxxx.nctu.me/query' }] })

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

  initCacheProvider(privateKeyStr) {
    const privateKey = loom.CryptoUtils.B64ToUint8Array(privateKeyStr)
    this.client = new loom.Client(this.chainId, this.writeUrl, this.readUrl)
    this.loomProvider = new loom.LoomProvider(this.client, privateKey)

    return true
  }

  async init() {
    // client
    this.client = new loom.Client(this.chainId, this.writeUrl, this.readUrl)

    // loom key
    const privateKey = loom.CryptoUtils.generatePrivateKey()
    this.publicKey = loom.CryptoUtils.publicKeyFromPrivateKey(privateKey)

    // eth signer
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
    const middlewaresUsed = this.loomProvider.accountMiddlewares.get(this.ethAddr.toLowerCase())
    console.log(middlewaresUsed)

    return true
  }

  async mapHdWallet(web3, newWallet, seedphrase) {
    // client
    this.client = new loom.Client(this.chainId, this.writeUrl, this.readUrl)

    // loom key
    const privateKey = loom.CryptoUtils.generatePrivateKey()
    this.publicKey = loom.CryptoUtils.publicKeyFromPrivateKey(privateKey)

    // eth signer
    this.ethAddr = newWallet.getAddressString()
    const ethPrivateKey = `0x${newWallet.getPrivateKey().toString('hex')}`
    let wallet = new ethers.Wallet(ethPrivateKey)
    let provider = new ethers.providers.JsonRpcProvider('https://rinkeby.infura.io/v3/4c3613edca8047f6afdb1e93dd615aee')

    let signer = new ethers.Wallet(ethPrivateKey, provider)
    const ethersSigner = new loom.EthersSigner(signer)

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