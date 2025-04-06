import qrcode
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
from io import BytesIO
import random
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/generate-qr', methods=['POST'])
def generate_qr():
    data = request.json
    product_info = data.get('data', '')
    
    # Extract product name or ID from the provided data
    product_name = product_info.split('_')[0] if product_info else 'product'
    
    # Create a standard formatted QR code with product info embedded
    timestamp = int(time.time())
    random_code = random.randint(1000, 9999)
    qr_data = f'SMART_INV_{timestamp}_{random_code}_{product_name}'
    
    # Create QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    # Create an image from the QR Code
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert the image to base64 string
    buffered = BytesIO()
    img.save(buffered)
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return jsonify({
        'qr_code': f'data:image/png;base64,{img_str}',
        'qr_data': qr_data
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001) 