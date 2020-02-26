'use strict'

const axios = require('axios')
const _ = require('lodash')
const api = 'https://api.mercadolibre.com'
const category = { id: "MLM1055", name: "Celulares y Smartphones" }
const sellerIds = [];

const getUsers = id => axios.get(`${api}/users/${id}`)
const getProds = nu => axios.get(`${api}/sites/MLM/search?category=${category.id}&sort=price_asc&offset=${nu}`)
const getBrand = ar => ar.filter(val => val.id == 'BRAND')

const genRequestProducts = function * (offset = 0) {
    //
    while (true) {
        yield getProds(offset)
        offset ++
    }
}

const promisifyFiftyProductRequests = () => {
    //
    let numRequests = 20; // 20 * 50 = 1000 (device results). 
    let promiseList = []
    const phonelist = genRequestProducts(0)

    while (numRequests --) {
        promiseList.push(phonelist.next().value)
    }

    return Promise.all(promiseList)
}

const promisifyAllUserRequests = () => {
    //
    const requests = sellerIds.map(id => getUsers(id))
    return Promise.all(requests)
}

const skeleton = async product => {

    let product_skeleton = {
        sellerID: null,
        sellerName: null,
        lugarOperacionSeller: null,
        marca: null,
        envioGratis: false,
        tipoLogistica: null,
        condicionArticulo: null,
        rangoPrecios: null,
    }

    // sellerID, sellerName:
    if (product.hasOwnProperty('seller') === true) {
        
        let sellerId = product.seller.id;
        if (sellerIds.includes(sellerId) === false) {
            sellerIds.push(sellerId)
        }

        product_skeleton.sellerID = sellerId
    }

    // lugarOperacionSeller:
    if (product.hasOwnProperty('seller_address') === true) {
        product_skeleton.lugarOperacionSeller = product.seller_address
    }

    // marca:
    if (product.hasOwnProperty('attributes') === true)
    if (product.attributes.length > 0) {
            let brand = getBrand(product.attributes)
            if (brand.length > 0) {
                product_skeleton.marca = (brand.shift()).value_name
            }
        }

    // envioGratis, tipoLogistica:
    if (product.hasOwnProperty('shipping') === true) {
        product_skeleton.envioGratis = !!product.shipping.free_shipping
        product_skeleton.tipoLogistica = product.shipping.logistic_type
    }

    // condicionArticulo:
    if (product.hasOwnProperty('condition') === true) {
        product_skeleton.condicionArticulo = product.condition
    }

    // rangoPrecios:
    if (product.hasOwnProperty('price') === true) {
        product_skeleton.rangoPrecios = product.price || 0
    }

    return product_skeleton
}

const models = (resource) => {
    resource = resource.map(async item => await skeleton(item))
    return Promise.all(resource)
}

const processProductList = async () => {

    // I can reduce the num of request made to mercado libre API:

    // first, promisify all product requests to execute all-in-one <promise> request:
    let response = (await promisifyFiftyProductRequests()).map(async ({ data }) => await models(data.results))
        response = await Promise.all(response)
    
    // second. Request all seller userdata via sellers promosified array,
    // the concept is the same, excecute all-in-one <promise> request:
    let cSellers = (await promisifyAllUserRequests()).map(({ data }) => ({
        id: data.id,
        nickname: data.nickname
    }))
    
    let flattend = _
    
        // flat array to a single level deep:
        .flatten(response)
        
        .map(p => {
            // append the corresponding seller to product model:
            let seller = cSellers.filter(s => { return s.id == p.sellerID }).shift() || null
            if (seller)
                p.sellerName = seller.nickname
            
            return p
        })

    return { top: flattend, ids: cSellers } // to destructuring parameters handling...
} 

const get_phonelist = async (req, res) => {
    //
    try {
        
        const { top, ids } = await processProductList()
        return res.status(200).send({
            response: {
                product_top: top,
                sellers_ids: ids
            },
            success: true,
            error: {}
        })

    } catch (error) {
        console.log("Error consumiendo API de mercado libre.")
        console.log(error)
        return res.status(500).send({
            response: "Error consumiendo API de mercado libre.",
            success: false,
            error: error
        })
    }

}

module.exports = { get_phonelist }
