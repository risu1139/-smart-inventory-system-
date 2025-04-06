/**
 * Feedback utilities for the Smart Inventory System
 * 
 * This script provides functions to simplify feedback collection for sales and individual items.
 */

class FeedbackManager {
    constructor() {
        this.apiBaseUrl = window.location.origin;
    }

    /**
     * Show a feedback form for a specific sale
     * @param {number} saleId - The ID of the sale
     * @param {Function} onSuccess - Callback function after successful submission
     */
    async showSaleFeedbackForm(saleId, onSuccess = null) {
        try {
            // Fetch sale information with items
            const response = await fetch(`${this.apiBaseUrl}/api/feedback/${saleId}`);
            if (!response.ok) {
                throw new Error('Could not fetch sale information');
            }
            
            const sale = await response.json();
            
            // Create modal container
            const modal = document.createElement('div');
            modal.className = 'feedback-modal';
            modal.innerHTML = `
                <div class="feedback-modal-content">
                    <div class="feedback-modal-header">
                        <h2>Your Feedback</h2>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="feedback-modal-body">
                        <div class="sale-info">
                            <h3>Purchase #${sale.id}</h3>
                            <p><strong>Date:</strong> ${new Date(sale.created_at).toLocaleDateString()}</p>
                            <p><strong>Total:</strong> ₹${sale.total_amount.toFixed(2)}</p>
                        </div>
                        
                        <form id="feedback-form-${sale.id}" class="feedback-form">
                            <div class="feedback-section">
                                <h3>Overall Experience</h3>
                                <div class="rating-group">
                                    <label>Your Rating:</label>
                                    <div class="star-rating" id="overall-rating">
                                        ${this._generateStarRating('overall', sale.overall_rating || 0)}
                                    </div>
                                </div>
                                <div class="comment-group">
                                    <label for="overall-comment">Comments:</label>
                                    <textarea id="overall-comment" name="overall-comment" 
                                        rows="3" placeholder="Share your experience...">${sale.overall_comment || ''}</textarea>
                                </div>
                            </div>
                            
                            <div class="feedback-section">
                                <h3>Product Feedback</h3>
                                <div class="items-list">
                                    ${this._generateItemsFeedback(sale.items)}
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn-primary">Submit Feedback</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            // Add styles
            this._addStyles();
            
            // Add to document
            document.body.appendChild(modal);
            
            // Set up event handlers
            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.remove();
            });
            
            modal.querySelector(`#feedback-form-${sale.id}`).addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Gather form data
                const overallRating = parseInt(document.querySelector('input[name="overall-rating"]:checked').value);
                const overallComment = document.querySelector('#overall-comment').value.trim();
                
                // Gather item feedback
                const itemFeedback = [];
                for (const item of sale.items) {
                    const itemRatingInput = document.querySelector(`input[name="item-${item.id}-rating"]:checked`);
                    if (itemRatingInput) {
                        const itemRating = parseInt(itemRatingInput.value);
                        const itemComment = document.querySelector(`#item-${item.id}-comment`).value.trim();
                        
                        itemFeedback.push({
                            sale_item_id: item.id,
                            product_id: item.product_id,
                            rating: itemRating,
                            comment: itemComment
                        });
                    }
                }
                
                // Prepare feedback data
                const feedbackData = {
                    sale_id: sale.id,
                    overall_rating: overallRating,
                    overall_comment: overallComment,
                    item_feedback: itemFeedback
                };
                
                try {
                    // Submit feedback
                    const response = await fetch(`${this.apiBaseUrl}/api/submit-feedback`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(feedbackData)
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to submit feedback');
                    }
                    
                    const result = await response.json();
                    
                    // Show success message
                    modal.querySelector('.feedback-modal-body').innerHTML = `
                        <div class="success-message">
                            <h3>Thank You!</h3>
                            <p>Your feedback has been submitted successfully.</p>
                            <button class="btn-primary close-after-submit">Close</button>
                        </div>
                    `;
                    
                    modal.querySelector('.close-after-submit').addEventListener('click', () => {
                        modal.remove();
                        
                        // Call success callback if provided
                        if (onSuccess && typeof onSuccess === 'function') {
                            onSuccess(result);
                        }
                    });
                    
                } catch (error) {
                    console.error('Error submitting feedback:', error);
                    alert('There was an error submitting your feedback. Please try again.');
                }
            });
            
        } catch (error) {
            console.error('Error showing feedback form:', error);
            alert('Could not load feedback form. Please try again later.');
        }
    }
    
    /**
     * Show a feedback form for a specific item
     * @param {number} saleItemId - The ID of the sale item
     * @param {Function} onSuccess - Callback function after successful submission
     */
    async showItemFeedbackForm(saleItemId, onSuccess = null) {
        try {
            // Fetch item information
            const response = await fetch(`${this.apiBaseUrl}/api/sale-item-feedback/${saleItemId}`);
            if (!response.ok) {
                throw new Error('Could not fetch item information');
            }
            
            const item = await response.json();
            
            // Create modal container
            const modal = document.createElement('div');
            modal.className = 'feedback-modal';
            modal.innerHTML = `
                <div class="feedback-modal-content">
                    <div class="feedback-modal-header">
                        <h2>Product Feedback</h2>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="feedback-modal-body">
                        <div class="product-info">
                            <h3>${item.product_name}</h3>
                            <p><strong>Quantity:</strong> ${item.quantity}</p>
                            <p><strong>Price:</strong> ₹${item.price.toFixed(2)}</p>
                        </div>
                        
                        <form id="item-feedback-form-${item.id}" class="feedback-form">
                            <div class="feedback-section">
                                <div class="rating-group">
                                    <label>Your Rating:</label>
                                    <div class="star-rating" id="item-rating-${item.id}">
                                        ${this._generateStarRating(`item-${item.id}`, item.rating || 0)}
                                    </div>
                                </div>
                                <div class="comment-group">
                                    <label for="item-${item.id}-comment">Comments:</label>
                                    <textarea id="item-${item.id}-comment" name="item-${item.id}-comment" 
                                        rows="3" placeholder="Share your thoughts on this product...">${item.comment || ''}</textarea>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn-primary">Submit Feedback</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            // Add styles
            this._addStyles();
            
            // Add to document
            document.body.appendChild(modal);
            
            // Set up event handlers
            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.remove();
            });
            
            modal.querySelector(`#item-feedback-form-${item.id}`).addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Gather form data
                const ratingInput = document.querySelector(`input[name="item-${item.id}-rating"]:checked`);
                if (!ratingInput) {
                    alert('Please select a rating');
                    return;
                }
                
                const rating = parseInt(ratingInput.value);
                const comment = document.querySelector(`#item-${item.id}-comment`).value.trim();
                
                // Prepare feedback data
                const feedbackData = {
                    sale_item_id: item.id,
                    product_id: item.product_id,
                    rating: rating,
                    comment: comment
                };
                
                try {
                    // Submit feedback
                    const response = await fetch(`${this.apiBaseUrl}/api/submit-item-feedback`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(feedbackData)
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to submit feedback');
                    }
                    
                    const result = await response.json();
                    
                    // Show success message
                    modal.querySelector('.feedback-modal-body').innerHTML = `
                        <div class="success-message">
                            <h3>Thank You!</h3>
                            <p>Your product feedback has been submitted successfully.</p>
                            <button class="btn-primary close-after-submit">Close</button>
                        </div>
                    `;
                    
                    modal.querySelector('.close-after-submit').addEventListener('click', () => {
                        modal.remove();
                        
                        // Call success callback if provided
                        if (onSuccess && typeof onSuccess === 'function') {
                            onSuccess(result);
                        }
                    });
                    
                } catch (error) {
                    console.error('Error submitting item feedback:', error);
                    alert('There was an error submitting your feedback. Please try again.');
                }
            });
            
        } catch (error) {
            console.error('Error showing item feedback form:', error);
            alert('Could not load feedback form. Please try again later.');
        }
    }
    
    /**
     * Generate HTML for star rating inputs
     * @private
     */
    _generateStarRating(name, currentRating = 0) {
        let html = '';
        for (let i = 5; i >= 1; i--) {
            html += `
                <input type="radio" id="${name}-rating-${i}" name="${name}-rating" value="${i}" ${i === currentRating ? 'checked' : ''}>
                <label for="${name}-rating-${i}">&#9733;</label>
            `;
        }
        return html;
    }
    
    /**
     * Generate HTML for item feedback sections
     * @private
     */
    _generateItemsFeedback(items) {
        if (!items || items.length === 0) {
            return '<p>No items found.</p>';
        }
        
        let html = '';
        for (const item of items) {
            html += `
                <div class="feedback-item">
                    <div class="feedback-item-title">
                        <span>${item.product_name} (${item.quantity} × ₹${item.price.toFixed(2)})</span>
                    </div>
                    <div class="rating-group">
                        <label>Your Rating:</label>
                        <div class="star-rating" id="item-rating-${item.id}">
                            ${this._generateStarRating(`item-${item.id}`, item.rating || 0)}
                        </div>
                    </div>
                    <div class="comment-group">
                        <label for="item-${item.id}-comment">Comments:</label>
                        <textarea id="item-${item.id}-comment" name="item-${item.id}-comment" 
                            rows="2" placeholder="Share your thoughts on this product...">${item.comment || ''}</textarea>
                    </div>
                </div>
            `;
        }
        return html;
    }
    
    /**
     * Add required CSS styles to the page
     * @private
     */
    _addStyles() {
        // Only add styles once
        if (document.getElementById('feedback-styles')) {
            return;
        }
        
        const styles = document.createElement('style');
        styles.id = 'feedback-styles';
        styles.textContent = `
            .feedback-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .feedback-modal-content {
                background-color: white;
                border-radius: 8px;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            .feedback-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .feedback-modal-header h2 {
                margin: 0;
                font-size: 1.25rem;
                color: #111827;
            }
            
            .close-modal {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #6b7280;
            }
            
            .feedback-modal-body {
                padding: 1.5rem;
            }
            
            .sale-info, .product-info {
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .feedback-form {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }
            
            .feedback-section {
                margin-bottom: 1.5rem;
            }
            
            .feedback-section h3 {
                font-weight: 600;
                margin-bottom: 1rem;
                color: #111827;
            }
            
            .rating-group, .comment-group {
                margin-bottom: 1rem;
            }
            
            .rating-group label, .comment-group label {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 500;
                color: #374151;
            }
            
            textarea {
                width: 100%;
                padding: 0.5rem;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                resize: vertical;
            }
            
            .feedback-item {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                padding: 1rem;
                border-radius: 8px;
                background-color: #f9fafb;
                margin-bottom: 1rem;
            }
            
            .feedback-item-title {
                font-weight: 600;
                color: #111827;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .star-rating {
                display: inline-flex;
                gap: 0.25rem;
                direction: rtl;
            }
            
            .star-rating input {
                display: none;
            }
            
            .star-rating label {
                cursor: pointer;
                color: #d1d5db;
                font-size: 1.5rem;
                transition: color 0.2s ease;
            }
            
            .star-rating label:hover,
            .star-rating label:hover ~ label,
            .star-rating input:checked ~ label {
                color: #fbbf24;
            }
            
            .form-actions {
                display: flex;
                justify-content: flex-end;
                margin-top: 1rem;
            }
            
            .btn-primary {
                background-color: #3b82f6;
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
                transition: background-color 0.2s;
            }
            
            .btn-primary:hover {
                background-color: #2563eb;
            }
            
            .success-message {
                text-align: center;
                padding: 2rem 1rem;
            }
            
            .success-message h3 {
                color: #10b981;
                margin-bottom: 1rem;
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// Create a global instance
window.feedbackManager = new FeedbackManager();

/**
 * Show feedback form for a sale
 * @param {number} saleId - The ID of the sale
 * @param {Function} onSuccess - Optional callback after successful submission
 */
function showFeedbackForm(saleId, onSuccess = null) {
    window.feedbackManager.showSaleFeedbackForm(saleId, onSuccess);
}

/**
 * Show feedback form for a specific item
 * @param {number} saleItemId - The ID of the sale item
 * @param {Function} onSuccess - Optional callback after successful submission
 */
function showItemFeedbackForm(saleItemId, onSuccess = null) {
    window.feedbackManager.showItemFeedbackForm(saleItemId, onSuccess);
} 