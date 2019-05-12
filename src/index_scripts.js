import {ABIBBS, ABIBBSExt, BBSContract, BBSExtContract, web3js, initDexon, loginDexon} from './dexon.js'
import {htmlEntities, getTitle, getUser} from './utils.js'

let account = ''
// const banList = [""]

const main = () => {
  initDexon(activeDexonRender)

  $('#bbs-login').click(() => { loginDexon(activeDexonRender) })

  const BBS = new web3js.eth.Contract(ABIBBS, BBSContract)
  const BBSExt = new web3js.eth.Contract(ABIBBSExt, BBSExtContract)

  BBS.getPastEvents({fromBlock : '1170000'})
  .then((events) => {
    events.slice().forEach((event) => {
      // if ( !banList.includes(event.transactionHash) )
      directDisplay(getTitle(event.returnValues.content.substr(0, 42)).title, event.transactionHash, event.blockNumber)
    })
  });
}

const countVotes = (txHash) => {
  const BBSExt = new web3js.eth.Contract(ABIBBSExt, BBSExtContract)
  return BBSExt.methods.upvotes(txHash.substr(0, 66)).call().then((upvotes) => {
    return BBSExt.methods.downvotes(txHash.substr(0, 66)).call().then((downvotes) => {
      return upvotes - downvotes
    })
  })
}

const directDisplay = (content, txHash, blockNumber) => {
  content = htmlEntities(content)
  const elem = $('<div class="r-ent"></div>')
  elem.html(
    `<div class="nrec"></div>
    <div class="title">
    <a href="content.html?tx=${txHash}">
      ${content}
    </a>
    </div>
    <div class="meta">
      <div class="author">
        <a target="_blank" href="https://dexonscan.app/transaction/${txHash}">
           @${blockNumber}
        </a>
      </div>
      <div class="article-menu"></div>
      <div class="date">...</div>
    </div>`)

  $('.r-list-container.action-bar-margin.bbs-screen').prepend(elem)

  web3js.eth.getBlock(blockNumber).then((block) => {
    const date = new Date(block.timestamp)
    $(elem).find('.date').text((date.getMonth()+1)+'/'+(''+date.getDate()).padStart(2, '0'))
                         .attr('title', date.toLocaleString())
  })

  countVotes(txHash).then((votes) => {
    if (votes > 0){
      let _class = 'hl f2'
      if (votes > 99) _class = 'hl f1'
      else if (votes > 9) _class = 'hl f3'
      $(elem).find('.nrec').html(`<span class="${_class}"> ${votes} </span>`)
    }
  })
}

const activeDexonRender = (account) => {
  account = getUser(account)

  if (account){
    // show User 
    $("#bbs-login").hide()
    $("#bbs-register").hide()
    $("#bbs-user").show()

    // show post btn
    $("#bbs-post").show()
  }
  else{
    // show Login/Register
    $("#bbs-login").show()
    $("#bbs-register").show()
    $("#bbs-user").hide()

    // hide post btn
    $("#bbs-post").show()
  }
  
  $("#bbs-user").text(account)  
}

$(main)