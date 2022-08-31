const axios = require('axios-https-proxy-fix');
const cheerio = require('cheerio')
const { Webhook,MessageBuilder  } = require('discord-webhook-node');
const figchalk = require('figchalk')   
const notifier = require('node-notifier');
const setTitle = require('node-bash-title');

const req = axios.create({
    withCredentials: true
});

class NB {
    constructor(task) {
        this.task = task; 
        this.uuid; 
        this.cookieArray; 
        this.cookie; 
        this.csrfToken; 
        this.sku = task.sku;
        this.styleCode = task.styleCode;
        this.size = task.size; 
        this.orderNum; 
        this.img; 
        this.price; 
        this.productName; 
        this.variant;
        this.webhook = task.settings.webhook
        this.globalWebhook = 'https://canary.discord.com/api/webhooks/771004860057255948/ZbfaVEpCnIDb2WKyjeYFaeSNRin2EeoDnaFa5W8dOK6H-ElwZSg7xEfs8kFNAFTQtSi4'
        this.profileName = task.profile.name
        this.fname = task.profile.fname;
        this.lname = task.profile.lname;
        this.address = task.profile.address
        this.address = this.address.split(' ')
        this.address = this.address.join('+')
        this.address = task.profile.address2
        this.state = task.profile.state;
        this.city = task.profile.city;
        this.zip = task.profile.zip; 
        this.email = task.profile.email;
        this.email = this.email.split('@')
        this.email = this.email.join('%40')
        this.phoneNum = task.profile.phoneNum;
        this.cardType = task.profile.card.type;
        this.cardNum = task.profile.card.num;
        this.cardMonth = task.profile.card.month;
        this.cardYear = task.profile.card.year;
        this.cvv = task.profile.card.cvv;
        this.monitorDelay = task.settings.monitorDelay; 
        this.retryDelay = task.settings.retryDelay; 
        this.proxy = task.proxy
        this.proxy = this.proxy.split(':')
        this.proxyIp = this.proxy[0]
        this.proxyPort = this.proxy[1]
        this.proxyUser = this.proxy[2]
        this.proxyPass = this.proxy[3]
        if (this.proxy != '') {
            this.proxyReq = {
                host: this.proxyIp,
                port: this.proxyPort,
                auth: {
                  username: this.proxyUser,
                  password: this.proxyPass
                }
            } 
        } else {
                this.proxyReq = false
            }
        this.carted = 0
        this.success = 0
        this.declines = 0
    }

async start() {
    try {
        require('log-timestamp')('[JHNY NB]')
        await this.getProduct()
        await this.addToCart() 
        await this.getTokens()
        await this.sumbitShipping()
        //await this.chooseShipping()
        await this.submitBilling()
        await this.placeOrder()
        this.updateTitle()
    }
    catch(err) {
        console.log(err)
    }
    
}

updateTitle() {
    setTitle(`JHNY AIO  ||      Carted -- [${this.carted}]            Success -- [${this.success}]             Declines-- [${this.declines}]`)
}

async getProduct() {
    const options = {
        method: 'get',
        url: `https://www.newbalance.com/on/demandware.store/Sites-NBUS-Site/en_US/Product-Variation?dwvar_${this.sku}_size=${this.size}&dwvar_${this.sku}_style=${this.styleCode}&dwvar_${this.sku}_width=&pid=${this.sku}&quantity=1`,
        proxy: this.proxyReq
    }
return req(options)
.then((res) => {
    this.price = res.data.product.price.sales.formatted
    this.variant = res.data.product["id"]
    this.img = res.data.product.images.productDetail[0]["url"]
    this.productName = res.data.product.images.productDetail[0]["alt"]
    console.log(figchalk.chalk(`Fetched Product Info "${this.productName}" [${res.status}]`, 'cyan'))
})
.catch((err) => {
    console.log(err.response.status)
})
}

async addToCart() {

const options = {
    method: 'post',
    url: 'https://www.newbalance.com/on/demandware.store/Sites-NBUS-Site/en_US/Cart-AddProduct',
    headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        origin: `https://www.newbalance.com`,
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
          "x-dtpc": "1$464533484_928h20vCNBQNWHEFAQQHNPDAGPFBITPQTPRLROR-0e9",
          "x-requested-with": "XMLHttpRequest",
    },
    data: `pid=${this.variant}&quantity=1&estimatedDelivery=&options=%5B%5D`,
    proxy: this.proxyReq
    /*transformResponse: [(data, headers) => {
      return headers, data;
    }]*/
  };

return req(options)
.then((res) => {
    if (res.status == 200) {
        //console.log(res.status)
        console.log(figchalk.chalk(`Carted Product [${res.status}]`, 'cyan'))
    }
    this.uuid =  res.data.cart.shipments[0]["UUID"]
    //console.log(this.uuid)
    this.cookieArray = res.headers["set-cookie"]
    //console.log(this.cookieArray)
    this.cookie = this.cookieArray.join(';')
    //console.log(this.cookie)
    this.carted = this.carted + 1
    this.updateTitle()
})
.catch((err) => {
    if (err.response.status == 500) {
        console.log(figchalk.chalk(`OOS, Retrying... [${err.response.status}]`, 'cyan'))
    } else if (err.response.status == 429) {
        console.log(fichalk.chalk(`Proxy Banned [${err.response.status}]`, 'red'))
    } else {
        console.log(figchalk.chalk(`Unkown Error [${err.response.status}]`, 'red'))
    }
})

}

async getTokens() {
    const options = {
        method: 'get',
        url: 'https://www.newbalance.com/checkout-begin/', 
        headers: {
            "accept-language": "en-US,en;q=0.9",
            accept: `text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9`,
            "accept-encoding": "gzip, deflate, br",
            cookie: `${this.cookie}`,
            origin: `https://www.newbalance.com`,
            'upgrade-insecure-requests': '1',
            "sec-fetch-mode": "navigate",
            "sec-fetch-user": "?1",
            "sec-fetch-dest": "document",
            "sec-fetch-site": "same-origin",
            "user-agent":
             "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
             "x-requested-with": "XMLHttpRequest",
             proxy: this.proxyReq
    },
}
return req(options)
.then((res) => {
    let $ = cheerio.load(res.data)
    this.csrfToken = $('input[name="csrf_token"]').val()
    //console.log(this.csrfToken)
    this.csrfToken = this.csrfToken.substring(0, this.csrfToken.length - 1)
    //console.log(this.csrfToken)
    if (res.status == 200) {
        console.log(figchalk.chalk(`Fetched Tokens [${res.status}]`, 'cyan'))
    }
})
.catch((err) => {
    console.log(err)
})
}


async sumbitShipping() {
    const options = { 
        method: 'post',
        url: 'https://www.newbalance.com/on/demandware.store/Sites-NBUS-Site/en_US/CheckoutShippingServices-SubmitShipping',
        headers: {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            cookie: `${this.cookie}`,
            origin: `https://www.newbalance.com`,
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
              "x-requested-with": "XMLHttpRequest",
        },
        data: `originalShipmentUUID=${this.uuid}&shipmentUUID=${this.uuid}&zipCodeErrorMsg=Please+enter+a+valid+Zip%2FPostal+code&shipmentSelector=new&dwfrm_shipping_shippingAddress_addressFields_country=US&dwfrm_shipping_shippingAddress_addressFields_firstName=${this.fname}&dwfrm_shipping_shippingAddress_addressFields_lastName=${this.lname}&dwfrm_shipping_shippingAddress_addressFields_address1=${this.address}&dwfrm_shipping_shippingAddress_addressFields_address2=${this.address2}&dwfrm_shipping_shippingAddress_addressFields_city=${this.city}&dwfrm_shipping_shippingAddress_addressFields_states_stateCode=${this.state}&dwfrm_shipping_shippingAddress_addressFields_postalCode=${this.state}&dwfrm_shipping_shippingAddress_addressFields_phone=${this.phoneNum}&dwfrm_shipping_shippingAddress_addressFields_email=${this.email}&dwfrm_shipping_shippingAddress_addressFields_addtoemaillist=true&csrf_token=${this.csrfToken}%3D&saveShippingAddr=false`,
        proxy: this.proxyReq
      };
return req(options)
.then((res) => {
    console.log(figchalk.chalk(`Submitted Shipping [${res.status}]`, 'cyan'))
}) 
.catch((err) => {
    console.log(err.response.status)
})
}

async chooseShipping() {
    const options = {
        method: 'post', 
        url: 'https://www.newbalance.com/on/demandware.store/Sites-NBUS-Site/en_US/CheckoutShippingServices-SelectShippingMethod', 
        headers: {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            cookie: `${this.cookie}`,
            origin: `https://www.newbalance.com`,
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
              "x-requested-with": "XMLHttpRequest",
        }, 
        data: `firstName=${this.fname}&lastName=${this.lname}&address1=${this.address}&address2=${this.address2}&city=${this.city}&postalCode=${this.zip}&stateCode=${this.state}&countryCode=US&phone=${this.phoneNum}&shipmentUUID=${this.uuid}&methodID=2-Air`
    }
    return req(options)
    .then((res) => {
        console.log(figchalk.chalk(`Updated Shipping Method [${res.status}]`, 'cyan'))
    })
    .catch((err) => {
        console.log(err.response.status)
    })
}

async submitBilling() {
    const options = { 
        method: 'post',
        url: 'https://www.newbalance.com/on/demandware.store/Sites-NBUS-Site/en_US/CheckoutServices-SubmitPayment',
        headers: {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            cookie: `${this.cookie}`,
            origin: `https://www.newbalance.com`,
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
              "x-requested-with": "XMLHttpRequest",
        },
        data: `csrf_token=${this.csrfToken}%3D&localizedNewAddressTitle=New+Address&dwfrm_billing_paymentMethod=CREDIT_CARD&dwfrm_billing_creditCardFields_cardNumber=${this.cardNum}&dwfrm_billing_creditCardFields_expirationMonth=${this.cardMonth}&dwfrm_billing_creditCardFields_expirationYear=${this.cardYear}&dwfrm_billing_creditCardFields_securityCode=${this.cvv}&dwfrm_billing_creditCardFields_cardType=${this.cardType}&dwfrm_billing_giropayBic=&dwfrm_billing_shippingAddressUseAsBillingAddress=true&addressSelector=${this.uuid}&dwfrm_billing_addressFields_country=US&dwfrm_billing_addressFields_firstName=${this.fname}&dwfrm_billing_addressFields_lastName=${this.lname}&dwfrm_billing_addressFields_address1=${this.address}&dwfrm_billing_addressFields_address2=${this.address2}&dwfrm_billing_addressFields_city=${this.city}&dwfrm_billing_addressFields_states_stateCode=${this.state}&dwfrm_billing_addressFields_postalCode=${this.zip}&dwfrm_billing_addressFields_email=${this.email}&dwfrm_billing_addressFields_phone=${this.phoneNum}&&dwfrm_billing_paymentMethod=CREDIT_CARD&dwfrm_billing_creditCardFields_cardNumber=${this.cardNum}&dwfrm_billing_creditCardFields_expirationMonth=${this.cardMonth}&dwfrm_billing_creditCardFields_expirationYear=${this.cardYear}&dwfrm_billing_creditCardFields_securityCode=${this.cvv}&dwfrm_billing_creditCardFields_cardType=${this.cardType}&dwfrm_billing_giropayBic=&addressId=${this.uuid}&saveBillingAddr=false`,
        proxy: this.proxyReq
      };
return req(options)
.then((res) => {
    console.log(figchalk.chalk(`Submitted Billing [${res.status}]`, 'cyan'))
    console.log(figchalk.chalk('Submitting Order...', 'yellow'))
})
.catch((err) => {
    console.log(err.response.status)
})
}

async placeOrder() {
    const options = { 
        method: 'post',
        url: 'https://www.newbalance.com/on/demandware.store/Sites-NBUS-Site/en_US/CheckoutServices-PlaceOrder?termsconditions=true',
        headers: {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            cookie: `${this.cookie}`,
            origin: `https://www.newbalance.com`,
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
              "x-requested-with": "XMLHttpRequest",
        },
        proxy: this.proxyReq
      };
req(options)
.then((res) => {
    if (res.data["error"] == true) {
        console.log(figchalk.chalk('Payment Declined', 'red'))
        this.declines = this.declines + 1
        this.updateTitle()
        this.sendNotiFail()
        this.sendHookFail()
        this.sendGlobalHookFail()
    } else {
        console.log(figchalk.chalk('Checked Out', 'greenBright'))
        this.success = this.success + 1
        this.updateTitle()
        this.orderNum = res.data.orderID
        this.sendNotiSuccess()
        this.sendHookSuccess()
        this.sendGlobalHookSuccess()
    }
})
.catch((err) => {
    console.log(err.response.status)
})
}

async sendHookSuccess() {
    const hook = new Webhook(this.webhook);
    const embed = new MessageBuilder()
.setTitle('Payment Success')
.setAuthor('JHNY AIO', 'https://cdn.discordapp.com/avatars/338066438868959234/67374063392b394ecf2856c5548fc113.png?size=128')
.addField('Site', 'New Balance')
.addField('Product', this.productName)
.addField('Price', this.price, true)
.addField('Size', this.size, true)
.addField('Mode', 'Requests')
.addField('Email', `||${this.email}||`)
.addField('Proxy', `||${this.proxy}||`)
.addField('Order Number', `||${this.orderNum}||`)
.setColor('#00FF00')
.setThumbnail(this.img)
.setFooter('Johnnyyyy#0191', 'https://cdn.discordapp.com/avatars/338066438868959234/67374063392b394ecf2856c5548fc113.png?size=128')
.setTimestamp();
 
    hook.send(embed);
}

async sendHookFail() {
    const hook = new Webhook(this.webhook);
    const embed = new MessageBuilder()
.setTitle('Payment Failed')
.setAuthor('JHNY AIO', 'https://cdn.discordapp.com/avatars/338066438868959234/67374063392b394ecf2856c5548fc113.png?size=128')
.addField('Site', 'New Balance')
.addField('Product', this.productName)
.addField('Price', this.price, true)
.addField('Size', this.size, true)
.addField('Mode', 'Requests')
.addField('Email', `||${this.email}||`)
.addField('Proxy', `||${this.proxy}||`)
.setColor('#FF0000')
.setThumbnail(this.img)
.setFooter('Johnnyyyy#0191', 'https://cdn.discordapp.com/avatars/338066438868959234/67374063392b394ecf2856c5548fc113.png?size=128')
.setTimestamp();
 
    hook.send(embed);

}

async sendGlobalHookSuccess() {
    const hook = new Webhook(this.globalWebhook);
 
    const embed = new MessageBuilder()
.setTitle('Payment Success  ')
.setAuthor('JHNY AIO', 'https://cdn.discordapp.com/avatars/338066438868959234/67374063392b394ecf2856c5548fc113.png?size=128')
.addField('Site', 'New Balance')
.addField('Product', this.productName)
.addField('Price', this.price, true)
.addField('Size', this.size, true)
.addField('Mode', 'Requests')
.setColor('#00FF00')
.setThumbnail(this.img)
.setFooter('Johnnyyyy#0191', 'https://cdn.discordapp.com/avatars/338066438868959234/67374063392b394ecf2856c5548fc113.png?size=128')
.setTimestamp();
 
    hook.send(embed);

}

async sendGlobalHookFail() {
    const hook = new Webhook(this.globalWebhook);
    const embed = new MessageBuilder()
.setTitle('Payment Failed')
.setAuthor('JHNY AIO', 'https://cdn.discordapp.com/avatars/338066438868959234/67374063392b394ecf2856c5548fc113.png?size=128')
.addField('Site', 'New Balance')
.addField('Product', this.productName)
.addField('Price', this.price, true)
.addField('Size', this.size, true)
.addField('Mode', 'Requests')
.setColor('#FF0000')
.setThumbnail(this.img)
.setFooter('Johnnyyyy#0191', 'https://cdn.discordapp.com/avatars/338066438868959234/67374063392b394ecf2856c5548fc113.png?size=128')
.setTimestamp();
 
    hook.send(embed);

}

sendNotiSuccess() {
    notifier.notify({
        title: 'JHNY AIO - Checked Out',
        message: `${this.productName}` + '\n' + `${this.price}`,
        icon: './icon.jpg'
      });
}

sendNotiFail() {
    notifier.notify({
        title: 'JHNY AIO - Payment Declined',
        message: `${this.productName}` + '\n' + `${this.price}`,
        icon: './icon.jpg'
      });
}

}

exports.NB = NB