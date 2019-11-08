import { fromMasterSeed } from 'ethereumjs-wallet/hdkey'
import { generateMnemonic, mnemonicToSeedSync } from 'bip39'

import LoomProvider from './lib/loom.js'
import Dett from './dett.js'
import {parseUser} from './utils.js'

const Web3Provider = Web3Vanilla.Web3Provider
const { InjectedConnector, NetworkOnlyConnector, PrivateKeyConnector } = Web3Vanilla.Connectors

let dett = null
let account = ''

let loomProvider = null

window.wWeb3 = null
let wWeb3Provider = null

const attachDropdown = () => {
  $('.user-menu > .trigger').click((e) => {
      var isShown = e.target.parentElement.classList.contains('shown');
      $('.user-menu.shown').toggleClass('shown');
      if (!isShown) {
          e.target.parentElement.classList.toggle('shown');
      }
      e.stopPropagation();
  })

  $(document).click((e) => { $('.user-menu.shown').toggleClass('shown') })
}

const hotkey = () => {
  if(!window.localStorage.getItem('hotkey-mode')) window.localStorage.setItem('hotkey-mode', 1)
  $('.hotkey-mode').text( +window.localStorage.getItem('hotkey-mode') ? "關閉" : "打開")

  $('.hotkey-mode-btn').click(() => {
    const hotkeyMode = +window.localStorage.getItem('hotkey-mode')
    window.localStorage.setItem('hotkey-mode', +!hotkeyMode)
    $('.hotkey-mode').text( +window.localStorage.getItem('hotkey-mode') ? "關閉" : "打開")
    window.location.reload()
  })
}

const renderTopbar = async (_account) => {
  if (_account){
    const addrDisp = parseUser(_account)
    const nickname = await dett.getMetaByAddress(_account)
    if (nickname.name) {
      $('#bbs-user').text(`${nickname.name} (${addrDisp})`)
    } else {
      $('#bbs-user').text(addrDisp)
    }

    // show User
    $("#bbs-login").hide()
    $("#bbs-more").hide()
    $("#bbs-user-menu").show()
  } else {
    // show Login/Register
    $("#bbs-login").show()
    $("#bbs-more").show()
    $("#bbs-user-menu").hide()
  }
}

class LoginDialog {
  constructor(_target) {
    this.target = _target
    this.bbsLoginButton = $('#bbs-modal-login')
    this.optAll = this.target.find('[name="accountSource"]')
    this.optInjected = this.optAll.filter('[value="injected"]')
    this.optSeed = this.optAll.filter('[value="seed"]')

    this.init()

    // event
    this.optAll.click(evt => {
      this.updateViewFromType(evt.currentTarget.value)
      // already handled in separate handler
      if (evt.currentTarget.value != 'injected') {
        this.bbsLoginButton.prop('disabled', false)
      }
    })

    this.bbsLoginButton.click(this.confirm.bind(this))

    $('#loginModal').on('show.bs.modal', this.show.bind(this))
  }

  init() {
    this.initInjectedWallet()
    this.initPrivateKeyWallet()


    // PrivateKey
    $('#commitSeedPhrase').click(() => {
      const newPhrase = this.target.find('[name="seed"]').val().trim()
      if (!newPhrase) {
        alert('請輸入助記詞')
        return
      }
      localStorage.setItem('dett-seed', newPhrase)
      this.updateViewForSeed(newPhrase)
    })

    $('#generateSeedPhrase').click(() => {
      this.generateSeed()
      this.target.find('.--seedAccountAddress').text('[請將助記詞妥善備份後按確認]')
    })

    $('#deleteSeedPhrase').click(() => {
      const ok = confirm('確定刪除助記詞？此動作無法恢復！')
      if (ok) {
        localStorage.removeItem('dett-seed')
        location.reload()
      }
    })
  }

  show() {
    // initial state
    $('#seedConfigArea').hide()

    this.restoreSelectedOption()

    if (this.injectedWeb3Provider) {
      this.bbsLoginButton.prop('disabled', false)
      this.toggleDescStatus(this.target.find('.wrapper--injected'), true)
      this.target.find('.wrapper--injected .desc-err').hide()
      this.target.find('.--injectedProviderStatus').text('正常')
    } else {
      this.toggleDescStatus(this.target.find('.wrapper--injected'), false)
      this.optInjected.attr('disabled', true)
      this.target.find('.--injectedProviderStatus').text('未偵測到錢包')
      this.target.find('.wrapper--injected .desc-err').text('請先安裝 MetaMask 或是 手機錢包 開啟')
    }
  }

  async confirm() {
    const loginType = this.getLoginFormType()
    window.localStorage.setItem('dett-login-type', loginType)
    switch (loginType) {
      case 'injected':
        this.bbsLoginButton.prop('disabled', true)
        this.toggleDescStatus(this.target.find('.wrapper--injected'), false)
        this.target.find('.wrapper--injected .desc-err').text('請同意錢包連線')

        // reset inject state
        this.injectedWeb3Provider.event.removeAllListeners()
        this.injectedWeb3Provider.unsetConnector()
        this._error = this.injectedWeb3Provider.event.once('error', (error) => {
          if (error) {
            if (error.code === 'ETHEREUM_ACCESS_DENIED') {
              this.target.find('.--injectedProviderStatus').text('連線請求失敗')
              this.target.find('.wrapper--injected .desc-err').text('你已拒絕錢包連線，請再次登入')
            } else if (error.code === 'UNSUPPORTED_NETWORK') {
              this.target.find('.--injectedProviderStatus').text('錯誤的網路')
              this.target.find('.wrapper--injected .desc-err').text('請打開錢包，並切換到 乙太坊 主網路')
            }
          }

          // remove useless onceActive
          this.injectedWeb3Provider.event.removeAllListeners()
          this.bbsLoginButton.prop('disabled', false)
        })

        this.injectedWeb3Provider.event.once('active', async (active) => {
          if (active) {
            // remove useless onceError
            this.injectedWeb3Provider.event.removeAllListeners()

            wWeb3 = this.injectedWeb3Provider.library
            wWeb3Provider = this.injectedWeb3Provider

            dett.account = wWeb3Provider.account
            renderTopbar(wWeb3Provider.account)
            await loomProvider.setEthereumWallet(wWeb3Provider.provider)
            await dett.init(loomProvider)

            this.injectedWeb3Provider.event.on('accountChanged', async (account) => {
              dett.account = account
              renderTopbar(account)
              await loomProvider.setEthereumWallet(wWeb3Provider.provider)
              await dett.init(loomProvider)
            })

            this.injectedWeb3Provider.event.on('error', (error) => {
              console.log(error)
            })

            this.bbsLoginButton.prop('disabled', false)
            this.close()
          }
        })

        await this.injectedWeb3Provider.setConnector('MetaMask')
        break
      case 'seed':
        this.bbsLoginButton.prop('disabled', true)
        const seedphrase = localStorage.getItem('dett-seed')
        const seed = mnemonicToSeedSync(seedphrase)
        const wallet = fromMasterSeed(seed).derivePath(`m/44'/60'/0'/0`).getWallet()
        const privateKey = wallet.getPrivateKey().toString('hex')

        const PrivateKey = new PrivateKeyConnector({
          providerURL: 'https://mainnet.infura.io/v3/a28f35f70591419cbf422c5e58cd047d',
          privateKey: privateKey,
        })

        // for bypass obfuscator
        const connectors = {}
        connectors.PrivateKey = PrivateKey

        this.privateKeyWeb3Provider = new Web3Provider({
          connectors: connectors,
          libraryName: 'web3.js',
          web3Api: Web3,
        })

        await this.privateKeyWeb3Provider.setConnector('PrivateKey')
        wWeb3 = this.privateKeyWeb3Provider.library
        wWeb3Provider = this.privateKeyWeb3Provider

        dett.account = wWeb3Provider.account
        renderTopbar(wWeb3Provider.account)
        await loomProvider.setEthereumWallet(wWeb3Provider.provider)
        await dett.init(loomProvider)
        this.bbsLoginButton.prop('disabled', false)
        this.close()
        break
      case 'vistor':
        wWeb3 = null
        wWeb3Provider = null

        if (this.injectedWeb3Provider) {
          this.injectedWeb3Provider.event.removeAllListeners()
          this.injectedWeb3Provider.unsetConnector()
        }
        else if (this.privateKeyWeb3Provider) {
          this.privateKeyWeb3Provider.unsetConnector()
        }
        renderTopbar('')
        this.close()
        break
      default:
    }
  }

  close() {
    $('#loginModal').modal('hide')
  }

  initInjectedWallet() {
    if (window.ethereum) {
      const MetaMask = new InjectedConnector({ supportedNetworks: [1] })
      const connectors = {}
      connectors.MetaMask = MetaMask
      this.injectedWeb3Provider = new Web3Provider({
        connectors: connectors,
        libraryName: 'web3.js',
        web3Api: Web3,
      })
    }
  }

  initPrivateKeyWallet() {
    const seed = localStorage.getItem('dett-seed')
    if (seed === null) {
      const newPhrase = this.generateSeed()
      localStorage.setItem('dett-seed', newPhrase)
    }

    this.updateViewForSeed(seed)
  }

  toggleDescStatus($el, ok) {
    const $elOk = $el.find('.desc-ok')
    const $elErr = $el.find('.desc-err')
    $elOk[ok ? 'show' : 'hide']()
    $elErr[ok ? 'hide' : 'show']()
    return [$elOk, $elErr]
  }

  restoreSelectedOption() {
    const loginType = window.localStorage.getItem('dett-login-type')
    const $visitorWrapper = this.target.find('.wrapper--vistor')
    this.updateViewFromType(loginType)
    if (loginType === 'injected') {
      this.target.prop("accountSource")[0].checked = true
      $visitorWrapper.show()
      this.bbsLoginButton.text('切換')
    }
    else if (loginType === 'seed') {
      this.target.prop("accountSource")[1].checked = true
      $visitorWrapper.show()
      this.bbsLoginButton.text('切換')
    }
    else if (loginType === 'vistor') {
      this.target.prop("accountSource")[2].checked = true
      $visitorWrapper.hide()
      this.bbsLoginButton.text('登入')
    }
  }

  getLoginFormType() {
    return this.target[0].accountSource.value || ''
  }

  updateViewFromType(type) {
    if (type == 'seed') {
      $('#seedConfigArea').show()
    } else {
      $('#seedConfigArea').hide()
    }
  }

  generateSeed() {
    // generate then commit
    const seedphrase = generateMnemonic()
    this.target.find('[name="seed"]').val(seedphrase)
    return seedphrase
  }

  updateViewForSeed(seedphrase) {
    const $el = this.target.find('.wrapper--seed')
    const [$elOk, $elErr] = this.toggleDescStatus($el, false)
    $elErr.text('正在由助記詞還原地址...')
    const seed = mnemonicToSeedSync(seedphrase)
    const wallet = fromMasterSeed(seed).derivePath(`m/44'/60'/0'/0`).getWallet()
    const seedAddress = wallet.getAddressString()
    this.toggleDescStatus($el, true)
    this.target.find('.--seedAccountAddress').text(seedAddress)
    this.target.find('[name="seed"]').val(seedphrase)
  }
}

window._layoutInit = async () => {
  loomProvider =  new LoomProvider({
    chainId: 'default',
    writeUrl: 'https://loom-basechain.xxxx.nctu.me/rpc',
    readUrl: 'https://loom-basechain.xxxx.nctu.me/query',
    libraryName: 'web3.js',
    web3Api: Web3,
  })
  loomProvider.setNetworkOnly()

  dett = new Dett()
  await dett.init(loomProvider)


  await new Promise(resolve => {
    $('#fragments').load($('#fragmentsSrc').attr('href'), resolve)
  })

  const loginDialog = new LoginDialog($('#loginForm'))
  if (localStorage.getItem('dett-login-type')) {
    loginDialog.show()
    await loginDialog.confirm()
  }

  hotkey()

  attachDropdown()

  // for parcel debug use
  if (+window.localStorage.getItem('dev'))
    window.dev = true

  return dett
}
