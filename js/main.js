/*-------------------------- 
  Constants
  --------------------------*/
// This key links the shop to the cart
const CART_KEY = 'museumCartV1';

const TAX_RATE = 0.102;
const MEMBER_DISCOUNT_RATE = 0.15;
const SHIPPING_RATE = 25.00;
const VOLUME_TIERS = [
    [0.00, 49.99, 0.00],
    [50.00, 99.99, 0.05],
    [100.00, 199.99, 0.10],
    [200.00, Infinity, 0.15]
];

/*-------------------------- 
  Collection-specific script 
  --------------------------*/
function showSection(section) {
    const Sections = document.querySelectorAll('.collection-section');
    Sections.forEach(s => s.style.display = 'none');
    document.getElementById(section).style.display = 'block';
}

// Show this section when the Collections page loads
if (window.location.pathname.endsWith('collections.html')) {
    window.onload = function () {
        showSection('archaeology');
    };
}

// Control Collections Modal
(function() {
    const Modal = document.getElementById('modal');
    const ModalBody = document.getElementById('modal-body');

    // "modal" is also used in Shop, but only Collection includes modal-body
    if (ModalBody) {
        const CloseBtn = Modal.querySelector('.close-modal');
        let lastTrigger = null;

        function openFrom(selector, trigger) {
            const Src = document.querySelector(selector);

            if (!Src) {
                console.warn('Missing modal content:', selector);
                return;
            }

            // Inject title from template
            const Title = Src.querySelector('h2').textContent;
            document.getElementById('artifact-title').textContent = Title;

            // Inject everything except the <h2>
            ModalBody.innerHTML = Src.innerHTML.replace(/<h2>.*?<\/h2>/, '');

            Modal.style.display = 'block';
            lastTrigger = trigger || null;
            CloseBtn.focus();

            // No scroll under modal
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            Modal.style.display = 'none';
            ModalBody.innerHTML = '';
            document.body.style.overflow = '';

            if (lastTrigger) {
                lastTrigger.focus();
            }
        }

        // Open on any element with data-modal target
        document.addEventListener('click', (e) => {
            const Trigger = e.target.closest('[data-modal-target]');

            if (Trigger) {
                e.preventDefault();
                openFrom(Trigger.getAttribute('data-modal-target'), Trigger);
                return;
            }

            if (e.target === Modal || e.target.closest('.close-modal')) {
                closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && Modal.style.display === 'block') {
                closeModal();
            }
        });
    }
})();

/*-------------------------- 
  Shop-specific script 
  --------------------------*/
if (window.location.pathname.endsWith('shop.html')) {
    window.onload = function () {
        const Cart = readCart();
        const CartBadge = this.document.getElementById('cartCount');
        const Items = this.document.querySelectorAll('.shop-wrapper-item');
        
        // Update header cart count
        if (CartBadge) {
            const Count = Cart.reduce((sum, item) => sum + item.qty, 0);
            CartBadge.textContent = Count > 0 ? `(${Count})` : '';
        }

        // Update per-item qty badges
        Items.forEach(card => {
            const Id = card.dataset.id;
            const Badge = card.querySelector('.qty-badge');
            const Item = Cart.find(it => it.id === Id);

            if (Badge) {
                Badge.textContent = Item ? `Qty: ${Item.qty}` : '';
            }
        })
    }
}

// Open Shop Modal
function openModal(imgElement) {
    const Column = imgElement.closest('.shop-wrapper-item');
    
    const Title = Column.querySelector('h3').textContent;
    const Description = Column.querySelector('.shop-text p').textContent;
    const Price = Column.querySelector('.modal-price-value').textContent;
    
    const Modal = document.getElementById('modal');
    const ModalImage = document.getElementById('modal-image');
    
    ModalImage.src = imgElement.src;
    ModalImage.alt = imgElement.alt;
    
    document.getElementById('modal-title').textContent = Title;
    document.getElementById('modal-description').textContent = Description;
    document.getElementById('modal-price').textContent = Price;
    
    Modal.style.display = 'block';
}

// Close Shop Modal
function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// This function reads the Cart information and write it to JSON
function readCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
}

function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// This function is called by the addToCart button
function addToCart(itemId) {
    // Read the dataset contained in the buttons and assign the values to variables
    const Id = itemId.dataset.id;
    const Name = itemId.dataset.name;
    const UnitPrice = Number(itemId.dataset.price);
    const Image = itemId.dataset.image;
    
    // Create cart object
    let cart = readCart();
    const Idx = cart.findIndex(it => it.id === Id);

    // Read the item card
    const Card = itemId.closest('.shop-wrapper-item');

    // Grab cart badge element
    const CartBadge = document.getElementById('cartCount');

    // Put all of the individual items and put them into cart and write it to LocalStorage
    if (Idx >= 0) {
        cart[Idx].qty += 1;
    } else {
        cart.push({ id: Id, name: Name, unitPrice: UnitPrice, qty: 1, image: Image });
    }

    writeCart(cart);

    // Update the item card's qty badge and cart badge
    if (Card) {
        const Badge = Card.querySelector('.qty-badge');

        if (Badge) {
            const Item = cart.find(it => it.id === Id);

            Badge.textContent = Item ? `Qty: ${Item.qty}` : '';
        }
    }

    // Update header cart badge
    if (CartBadge) {
        const Count = cart.reduce((sum, item) => sum + item.qty, 0);

        CartBadge.textContent = Count > 0 ? `(${Count})` : '';
    }
}

/*--------------------------
  Cart-specific script
  --------------------------*/
// Currency with parentheses for negatives
function money(n) {
    const Sign = n < 0 ? -1 : 1;
    const S = '$' + Math.abs(n).toFixed(2);
    return Sign < 0 ? '(' + S + ')' : S;
}

// Return the volume discount rate given an item total
function volumeRate(total) {
    for (const [min, max, rate] of VOLUME_TIERS) {
        if (total >= min && total <= max) {
            return rate;
        }
    }

    return 0;
}

// Remove a line item entirely (qty=0 => drop row)
function removeItem(id) {
    const Next = readCart().filter(it => it.id !== id);
    writeCart(Next);
    render();
}

// Clear cart = inital state (cart empty, member unchecked)
function clearCart() {
    writeCart([]);
    document.getElementById('memberToggle').checked = false;
    render();
}

function incQty(id) {
    const Cart = readCart();
    const Item = Cart.find(it => it.id === id);

    if (Item) {
        Item.qty += 1;
        writeCart(Cart);
        render();
    }
}

function decQty(id) {
    const Cart = readCart();
    const Item = Cart.find(it => it.id === id);

    if (Item) {
        Item.qty -= 1;

        if (Item.qty <= 0) {
            removeItem(id);
        } else {
            writeCart(Cart);
            render();
        }
    }
}

// Single render pass.
// - Reads cart from LocalStorage
// - Computes totals
// - Applies discount rule (mutually exclusive)
// - Applies shipping
// - Compute tax
// - Outputs formatted summary
function render() {
    // 1. Get DOM references
    const ItemsDiv = document.getElementById('items');
    const SummaryPre = document.getElementById('summary');
    const EmptyMsg = document.getElementById('emptyMsg');
    const ItemsField = document.getElementById("itemsField");
    const IsMember = document.getElementById('memberToggle').checked;
    const Buttons = document.getElementById('buttons');
    const FreeShipBadge = document.getElementById('freeShipBadge');
    
    // 2. Read cart + filter invalid items
    const Cart = readCart().filter(it => it.qty > 0 && it.unitPrice > 0);
    
    // 3. Initialize variables
    let html = '';
    let summary = '';
    let itemTotal = 0;
    let volumeRateApplied = 0;
    let volumeDiscount = 0;
    let memberDiscount = 0;
    let shipping = 0;
    let subTotal = 0;
    let taxAmount = 0;
    let hasFreeShipping = false;
    let taxRateFormatted = Intl.NumberFormat("en-US",
            {style: "percent", minimumFractionDigits: 2}).format(TAX_RATE);

    const Pad = (label, amount) => label.padEnd(32, ' ') + amount.toString().padStart(12, ' ');

    // 4. Empty cart case
    if (Cart.length === 0) {
        ItemsDiv.hidden = true;
        EmptyMsg.hidden = false;
        Buttons.hidden = true;
        FreeShipBadge.hidden = true;
        ItemsField.innerHTML = html;
    } else {
        // 5. Build line items + compute item total
        html = `
            <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>UnitPrice</th>
                <th>LineTotal</th>
                <th>Remove</th>
            </tr>
        `;

        Cart.forEach(s => {
            const LineTotal = s.unitPrice * s.qty;
            itemTotal += LineTotal;

            html += `
                <tr>
                    <td>
                        <div class="cart-item">
                            <img src="${s.image}" class="cart-image">
                            <div class="cart-text">
                                <p class="cart-name">${s.name}</p>
                            </div>
                        </div>
                    </td>
                    <td>${s.qty}</td>
                    <td class="amounts">${money(s.unitPrice)}</td>
                    <td class="amounts">${money(LineTotal)}</td>
                    <td>
                        <button class="qty-btn" onclick="decQty('${s.id}')">-</button>
                        <button class="qty-btn" onclick="incQty('${s.id}')">+</button>
                        <button onclick="removeItem('${s.id}')">Remove</button>
                    </td>
                </tr>
            `;
        });

        // 6. Apply discounts (mutually exclusive rule)
        volumeRateApplied = volumeRate(itemTotal);
        
        if (IsMember && volumeRateApplied > 0) {
            let choice = prompt('Only one discount may be applied. Type \'M\' for Member or \'V\' for Volume:');

            // Normalize input
            if (choice) {
                choice = choice.trim().toLowerCase();
            }

            // Default to member unless user explicitly choose 'v'
            if (choice === 'v') {
                volumeDiscount = -itemTotal * volumeRate(itemTotal);
                document.getElementById('memberToggle').checked = false;
            } else {
                memberDiscount = -itemTotal * MEMBER_DISCOUNT_RATE;
            }
        } else if (IsMember) {
            memberDiscount = -itemTotal * MEMBER_DISCOUNT_RATE;
        } else {
            volumeDiscount = -itemTotal * volumeRateApplied;
        }

        // 7. Shipping logic (free shipping at $200+ item total)
        hasFreeShipping = itemTotal >= 200;
        FreeShipBadge.hidden = !hasFreeShipping;
        shipping = hasFreeShipping ? 0 : SHIPPING_RATE;

        // 8. Subtotal + tax calculation
        subTotal = itemTotal + volumeDiscount + memberDiscount + shipping;
        taxAmount = subTotal * TAX_RATE;

        // 9. Inject into DOM
        ItemsField.innerHTML = html;

        ItemsDiv.hidden = false;
        EmptyMsg.hidden = true;
        Buttons.hidden = false;
    }

    // 10. Build summary
    summary = `
        ${Pad('Subtotal of Item Totals', money(itemTotal))}
        ${Pad('Volume Discount', money(volumeDiscount))}
        ${Pad('Member Discount', money(memberDiscount))}
        ${Pad(hasFreeShipping ? 'Free Shipping ($25.00 value)' : 'Shipping', money(shipping))}
        ${Pad('Subtotal (Taxable amount)', money(subTotal))}
        ${Pad('Tax Rate %', taxRateFormatted)}
        ${Pad('Tax Amount $', money(taxAmount))}
        ${Pad('Invoice Total', money(subTotal + taxAmount))}
    `;

    SummaryPre.textContent = summary;
}

// Render when the Cart page loads
if (window.location.pathname.endsWith('cart.html')) {
    window.onload = function () {
        render();

        // Events -> re-render
        document.getElementById('memberToggle').addEventListener('change', render);
        document.getElementById('clearBtn').addEventListener('click', clearCart);
    };
}
