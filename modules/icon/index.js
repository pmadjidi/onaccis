import base64

ws_client.write_message({
    "img": base64.b64encode(img_data),
    "desc": img_description,
})
