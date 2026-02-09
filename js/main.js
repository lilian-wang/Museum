/*------------------------ 
Collection-specific script 
------------------------*/
function showSection(section) {
    const sections = document.querySelectorAll('.collection-section');
    sections.forEach(s => s.style.display = 'none');
    document.getElementById(section).style.display = 'block';
}

// Show this section when the Collections page loads
if (window.location.pathname.endsWith("collections.html")) {
    window.onload = function () {
        showSection('archaeology');
    };
}

/*------------------------ 
Shop-specific script 
------------------------*/
function openModal(imgElement) {
    const column = imgElement.closest(".shop-wrapper-column");
    
    const title = column.querySelector("h3").textContent;
    const description = column.querySelector(".shop-text p").textContent;
    const price = column.querySelector(".price").textContent;
    
    const modal = document.getElementById("modal");
    const modalImage = document.getElementById("modal-image");
    
    modalImage.src = imgElement.src;
    modalImage.alt = imgElement.alt;
    
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-description").textContent = description;
    document.getElementById("modal-price").textContent = price;
    
    modal.style.display = "block";
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
}

function addToCart(itemId) {
    alert("Added " + itemId + " to cart (functionality to come)");
    // Future: Push to cart array
}
