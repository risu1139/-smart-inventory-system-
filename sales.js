document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const salesForm = document.getElementById('salesForm');
    const productSelect = document.getElementById('productSelect');
    const addToListBtn = document.getElementById('addToList');
    const itemsList = document.getElementById('itemsList');
    const quantityModal = document.getElementById('quantityModal');
    const quantityForm = document.getElementById('quantityForm');
    const closeModal = document.querySelector('.close-modal');
    const totalAmountElement = document.querySelector('.total-amount');

    // Sample product data (replace with actual data from your backend)
    const products = {
        'product1': { name: 'Laptop Pro X', price: 85000 },
        'product2': { name: 'Wireless Mouse', price: 1500 },
        'product3': { name: 'External SSD', price: 8500 }
    };

    let selectedProduct = null;
    let items = [];

    // Function to update total amount
    function updateTotal() {
        const total = items.reduce((sum, item) => sum + item.total, 0);
        totalAmountElement.textContent = `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }

    // Function to add item to the list
    function addItemToList(product, quantity) {
        const total = product.price * quantity;
        const item = {
            product: product.name,
            quantity: quantity,
            price: product.price,
            total: total
        };
        items.push(item);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${quantity}</td>
            <td>${product.name}</td>
            <td>₹${product.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td>₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td>
                <button type="button" class="remove-item-btn">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;

        // Add click handler for remove button
        const removeBtn = row.querySelector('.remove-item-btn');
        removeBtn.addEventListener('click', function() {
            const index = Array.from(itemsList.children).indexOf(row);
            items.splice(index, 1);
            row.remove();
            updateTotal();
        });

        itemsList.appendChild(row);
        updateTotal();
    }

    // Open quantity modal when Add to List is clicked
    addToListBtn.addEventListener('click', function() {
        try {
            const productId = productSelect.value;
            if (!productId) {
                alert('Please select a product');
                return;
            }
            selectedProduct = products[productId];
            if (!selectedProduct) {
                throw new Error('Product not found');
            }
            quantityModal.style.display = 'block';
            document.getElementById('quantity').value = '1';
            document.getElementById('quantity').focus();
        } catch (error) {
            console.error('Error adding product:', error);
            alert('An error occurred while adding the product. Please try again.');
        }
    });

    // Close modal
    function closeModalHandler() {
        quantityModal.style.display = 'none';
        document.getElementById('quantity').value = '1';
    }

    closeModal.addEventListener('click', closeModalHandler);

    window.addEventListener('click', function(e) {
        if (e.target === quantityModal) {
            closeModalHandler();
        }
    });

    // Handle quantity form submission
    quantityForm.addEventListener('submit', function(e) {
        e.preventDefault();
        try {
            const quantity = parseInt(document.getElementById('quantity').value);
            
            if (quantity < 1) {
                alert('Please enter a valid quantity');
                return;
            }

            if (!selectedProduct) {
                throw new Error('No product selected');
            }

            addItemToList(selectedProduct, quantity);
            closeModalHandler();
            productSelect.value = '';
        } catch (error) {
            console.error('Error adding item:', error);
            alert('An error occurred while adding the item. Please try again.');
        }
    });

    // Handle form submission
    salesForm.addEventListener('submit', function(e) {
        e.preventDefault();
        try {
            if (items.length === 0) {
                alert('Please add at least one item to the list');
                return;
            }

            const formData = {
                customerName: document.getElementById('customerName').value.trim(),
                items: items,
                totalAmount: items.reduce((sum, item) => sum + item.total, 0),
                date: new Date().toISOString()
            };

            if (!formData.customerName) {
                alert('Please enter a customer name');
                return;
            }

            // Here you would typically send the data to your backend
            console.log('Sale data:', formData);
            
            // Clear form
            salesForm.reset();
            items = [];
            itemsList.innerHTML = '';
            updateTotal();
            
            alert('Sale recorded successfully!');
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('An error occurred while saving the sale. Please try again.');
        }
    });
}); 