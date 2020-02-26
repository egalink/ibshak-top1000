## Top 1000 (RESt api)

Un pequeño servicio realizado con el blueprint de Express.js que permite consultar el top 1,000 de los productos más baratos vendidos en mercado libre. Filtrado por dispositivos celulares.

### Requerimientos mínimos

-   Node.js >= 8.0.0
-   npm >= 3.0.0

### Instalación de dependencias
Tan sencillo como ejecutar el comando `npm i` sobre la carpeta raíz del proyecto.

### Ejecución del servicio
El proyecto ya viene debidamente pre-configurado:

`> npm start`

-- -

#### Endpoint de servicio
`127.0.0.1:3000/api/ibushak/get-phonelist`

#### Respuesta de servicio (payload)
```
{
	"response": {
		"product_top": [
			{
				"sellerID": 451405081,
				"sellerName": "GRUPO TELMOV",
				"lugarOperacionSeller": {,
					"id": "",
					"comment": "",
					"address_line": "",
					"zip_code": "",
					"country": {
						"id": "MX",
						"name": "Mexico"
					},
					"state": {
						"id": "MX-DIF",
						"name": "Distrito Federal"
					},
					"city": {
						"id": "TUxNQ1hPQzQ1NzE",
						"name": "Xochimilco"
					},
					"latitude": "",
					"longitude": ""
				},
				"marca": "Motorola",
				"envioGratis": true,
				"tipoLogistica": "fulfillment",
				"condicionArticulo": "new",
				"rangoPrecios": 2240
			}
			// ... 
		],
		"sellers_ids": [
			{
				"id": 451405081,
				"nickname": "GRUPO TELMOV"
			},
			// ...
		]
	},
	"success": true,
	"error": {}
}
```

### Licencia

Sin licencia.