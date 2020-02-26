'use strict'

const axios = require('axios')
const _ = require('lodash')
const api = 'https://api.mercadolibre.com'
const category = { id: "MLM1055", name: "Celulares y Smartphones" }
const sellerIds = [];

const getUser = id => axios.get(`${api}/users/${id}`)
const getBrand = attributes => attributes.filter(val => val.id == 'BRAND')

const getUserInfo = async ({ id }) => {

    try {
        const {data} = await getUser(id)
        return data
    } catch (error) {
        return null
    }

}

const genRequests = function * (offset = 0) {
    //
    while (true) {
        yield axios.get(`${api}/sites/MLM/search?category=${category.id}&sort=price_asc&offset=${offset}`)
        offset ++
    }
}

const promisifyFiftyRequests = () => {
    //
    let numRequests = 20; // 20 * 50 = 1000 (device results). 
    let promiseList = []
    const phonelist = genRequests(0)

    while (numRequests --) {
        promiseList.push(phonelist.next().value)
    }

    return Promise.all(promiseList)
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

        /*let userinfo = await getUserInfo(product.seller)
        if (userinfo) {
            product_skeleton.sellerName = userinfo.hasOwnProperty('nickname') ? userinfo.nickname : null;
        }//*/

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

const get_phonelist = async (req, res) => {
    //
    try {
        
        let response = (await promisifyFiftyRequests()).map(async ({ data }) => await models(data.results))
            response = await Promise.all(response)
        
        // flat array to a single level deep:
        let flattend = _.flatten(response)

        return res.status(200).send({
            response: {
                product_top: flattend,
                sellers_ids: sellerIds
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
