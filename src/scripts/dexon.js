import { fromMasterSeed } from 'ethereumjs-wallet/hdkey'
import { mnemonicToSeed } from 'bip39'
import { ethers } from 'ethers'
import {
  NonceTxMiddleware,
  SignedEthTxMiddleware,
  CryptoUtils,
  Client,
  LoomProvider,
  Address,
  LocalAddress,
  Contracts,
  EthersSigner,
  createDefaultTxMiddleware
} from 'loom-js'

class EventEmitter{
  constructor(){
    this._events={}
  }
  on(event,callback){
    let callbacks = this._events[event] || []
    callbacks.push(callback)
    this._events[event] = callbacks
    return this
  }
  off(event,callback){
    let callbacks = this._events[event]
    this._events[event] = callbacks && callbacks.filter(fn => fn !== callback)
    return this
  }
  emit(...args){
    const event = args[0]
    const params = [].slice.call(args,1)
    const callbacks = this._events[event]
    if (callbacks) {
      callbacks.forEach(fn => fn.apply(this, params))
    }
    return this
  }
  once(event,callback){
    let wrapFunc = (...args) => {
      callback.apply(this,args)
      this.off(event,wrapFunc)
    }
    this.on(event,wrapFunc)
    return this
  }
}

// provide an abstraction over dexon provider & seed
class IdentityManager extends EventEmitter {
  constructor(provider) {
    super()
    this.injectedProvider = provider
    this.injectedAddress = null
    this.seedAddress = null
    this.__loginType = null
    this.__seed = localStorage.getItem('dett-seed') || null
    if (this.__seed != null) {
      this.seed = this.__seed
    }
  }

  init() {
    // recover last used login type
    const savedLoginType = localStorage.getItem('dett-login-type')
    if (savedLoginType) {
      this.commitLoginType(savedLoginType)
    }
  }

  commitLoginType(type) {
    this.__loginType = type
    const wallet = this.wallet
    if (type == 'seed') {
      if (!this.wallet) {
        throw new Error('Seed is to be used but no valid wallet is given. (should call setHdWallet first?)')
      }
    }

    if (this.activeAccount !== null) {
      this.emit('login', {
        account: this.activeAccount,
        wallet: type == 'seed' ? this.wallet : null,
      })
    }
  }

  useInjectedAddress(address) {
    this.injectedAddress = address
    if (this.loginType == 'injected') {
      this.commitLoginType('injected')
    }
  }

  async setHdWallet(seedphrase) {
    this.seed = seedphrase
    const seed = await mnemonicToSeed(seedphrase)
    const wallet = fromMasterSeed(seed).derivePath(`m/44'/60'/0'/0`).getWallet()
    this.wallet = wallet
    this.seedAddress = wallet.getAddressString()
  }

  get loginType() {
    return this.__loginType
  }

  get activeAccount() {
    const t = this.loginType
    if (t == 'injected') {
      return this.injectedAddress
    } else if (t == 'seed') {
      return this.seedAddress
    } else if (t == 'vistor') {
      return ''
    } else if (t != null) {
      console.warn('[IdentityManager] Unsupported login type', t)
      return null  // NULL?
    }
  }

  get seed() {
    return this.__seed
  }

  set seed(s) {
    if (s == null) {
      localStorage.removeItem('dett-seed')
      return
    }
    this.__seed = s.trim()
    localStorage.setItem('dett-seed', s)
  }
}

class Dexon extends EventEmitter {
  constructor(_dexon, identityManager = null) {
    super()
    // this.dexon = _dexon
    this.providerName = null
    this.dexonWeb3 = ''
    this.__selectedAddress = ''
    this.__dett = null
    this.__selectedAddress = null
    this.__networkId = null
    // Loom
    this.chainId = 'extdev-plasma-us1'
    this.writeUrl = 'ws://extdev-plasma-us1.dappchains.com/websocket'
    this.readUrl = 'ws://extdev-plasma-us1.dappchains.com/queryws'
    this.ethAddress = null
    this.client = null
    this.loomProvider = null
    this.publicKey = null
    // Loom

    const providerDetectList = [
      {
        name: 'DEXON Wallet',
        factory: () => _dexon,
      },
      {
        name: 'MetaMask',
        factory: () => window.ethereum,
      },
    ]
    providerDetectList.some(({name, factory}) => {
      const p = factory()
      if (p) {
        this.dexon = p
        this.providerName = name
        return true
      } else {
        return false
      }
    })

    this.isOfficial = (this.dexon && this.dexon == _dexon)
    this.identityManager = identityManager || new IdentityManager(this.dexon)
  }

  async initLoom() {
    const privateKey = CryptoUtils.generatePrivateKey()
    this.publicKey = CryptoUtils.publicKeyFromPrivateKey(privateKey)
    this.client = new Client(this.chainId, this.writeUrl, this.readUrl)
    const ethersProvider = new ethers.providers.Web3Provider(this.dexonWeb3.currentProvider)
    const signer = ethersProvider.getSigner()
    this.ethAddress = await signer.getAddress()
    const to = new Address('eth', LocalAddress.fromHexString(this.ethAddress))
    const from = new Address(this.client.chainId, LocalAddress.fromPublicKey(this.publicKey))
    this.client.txMiddleware = createDefaultTxMiddleware(this.client, privateKey)
    const addressMapper = await Contracts.AddressMapper.createAsync(this.client, from)

    if (await addressMapper.hasMappingAsync(to).catch(() => { return true })) {
      console.log('Mapping already exists.')
    } else {
      console.log('Adding a new mapping.')
      const ethersSigner = new EthersSigner(signer)
      await addressMapper.addIdentityMappingAsync(from, to, ethersSigner)
    }

    this.loomProvider = new LoomProvider(this.client, privateKey)
    this.loomProvider.setMiddlewaresForAddress(to.local.toString(), [
      new NonceTxMiddleware(to, this.client),
      new SignedEthTxMiddleware(signer)
    ])
    return true
  }

  init() {
    if (!this.dexon) return

    this.dexonWeb3 = new Web3(this.dexon)

    /*
    console.log(this.dexonWeb3.currentProvider.publicConfigStore)
    if (this.dexonWeb3.currentProvider.publicConfigStore) {
      this.dexonWeb3.currentProvider.publicConfigStore.on('update', (data) => {
        if ('networkVersion' in data)
          if (data.networkVersion === '237'){
            this.selectedAddress = 'selectedAddress' in data ? data.selectedAddress : ''
          }
      })
    } else {
      const poll = async () => {
        const networkID = await this.dexonWeb3.eth.net.getId()
        this.networkId = networkID
        if (networkID === 1 || networkID === 4) {
          const accounts = await this.dexonWeb3.eth.getAccounts()
          this.selectedAddress = accounts.length > 0 ? accounts[0] : ''
        } else {
          const error = new Error('Wrong network')
          error.code = 'wrong-network'
          this.emit('error', error)
          return
        }
      }

      poll()
      setInterval(poll, 1000)
    }
    */
    
    const poll = async () => {
      const networkID = await this.dexonWeb3.eth.net.getId()
      this.networkId = networkID
      if (networkID === 1 || networkID === 4) {
        const accounts = await this.dexonWeb3.eth.getAccounts()
        this.selectedAddress = accounts.length > 0 ? accounts[0] : ''
      } else {
        const error = new Error('Wrong network')
        error.code = 'wrong-network'
        this.emit('error', error)
        return
      }
    }

    poll()
    setInterval(poll, 1000)
    this.initLoom()
  }

  login(){
    if ( !this.dexon) return alert('DEXON Wallet not detected. (請安裝 DEXON 瀏覽器擴充套件)')

    this.dexon.enable()
    this.init()
  }

  get selectedAddress() {
    return this.__selectedAddress
  }

  set selectedAddress(addr) {
    if (this.__selectedAddress == addr) return
    this.emit('update', addr)
    this.__selectedAddress = addr
  }

  get networkId() {
    return this.__networkId
  }

  set networkId(id) {
    if (this.__networkId == id) return
    this.emit('updateNetwork', {
      id,
      isValid: id === 237,
    })
    this.__networkId = id
  }
}

export default Dexon
