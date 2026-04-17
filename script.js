const barberShops = [
    {
        id: 1,
        name: "Classic Cuts Barber Shop",
        location: "Civil Lines, Prayagraj",
        rating: 4.8,
        reviews: 245,
        services: ["haircut", "beard", "styling"],
        prices: { haircut: 300, beard: 150, styling: 200 },
        slots: ["10:00 AM", "11:30 AM", "02:00 PM", "04:30 PM", "06:00 PM"]
    },
    {
        id: 2,
        name: "Style Studio",
        location: "Muttganj, Prayagraj",
        rating: 4.5,
        reviews: 189,
        services: ["haircut", "beard", "shave"],
        prices: { haircut: 250, beard: 120, shave: 100 },
        slots: ["09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM"]
    },
    {
        id: 3,
        name: "Gentlemen's Lounge",
        location: "Kamla Nagar, Prayagraj",
        rating: 4.9,
        reviews: 312,
        services: ["haircut", "beard", "styling", "combo"],
        prices: { haircut: 350, beard: 200, styling: 250, combo: 500 },
        slots: ["10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM"]
    },
    {
        id: 4,
        name: "Urban Barber",
        location: "Tagore Town, Prayagraj",
        rating: 4.6,
        reviews: 156,
        services: ["haircut", "beard", "shave"],
        prices: { haircut: 280, beard: 140, shave: 120 },
        slots: ["09:30 AM", "11:30 AM", "01:30 PM", "03:30 PM", "05:30 PM"]
    },
    {
        id: 5,
        name: "Royal Cuts",
        location: "Alopibagh, Prayagraj",
        rating: 4.7,
        reviews: 203,
        services: ["haircut", "beard", "styling", "combo"],
        prices: { haircut: 320, beard: 180, styling: 220, combo: 550 },
        slots: ["10:00 AM", "11:00 AM", "02:00 PM", "04:00 PM", "06:30 PM"]
    },
    {
        id: 6,
        name: "Fresh Look Salon",
        location: "Georgetown, Prayagraj",
        rating: 4.4,
        reviews: 178,
        services: ["haircut", "beard", "shave"],
        prices: { haircut: 200, beard: 100, shave: 80 },
        slots: ["10:00 AM", "12:30 PM", "03:00 PM", "05:00 PM"]
    }
];

const state = {
    currentStep: 1,
    selectedShop: null,
    selectedSlot: null,
    selectedService: null,
    customerDetails: {},
    currentLanguage: "en",
    searchFilters: {
        location: "",
        service: "",
        price: "",
        rating: 0
    }
};

const API = {
    async getShops(filters = {}) {
        let shops = [...barberShops];
        
        if (filters.location) {
            shops = shops.filter(shop => 
                shop.location.toLowerCase().includes(filters.location.toLowerCase()) ||
                shop.name.toLowerCase().includes(filters.location.toLowerCase())
            );
        }
        
        if (filters.service) {
            shops = shops.filter(shop => shop.services.includes(filters.service));
        }
        
        if (filters.minRating) {
            shops = shops.filter(shop => shop.rating >= filters.minRating);
        }
        
        if (filters.priceRange) {
            const [min, max] = filters.priceRange.split("-").map(Number);
            shops = shops.filter(shop => {
                const minPrice = Math.min(...Object.values(shop.prices));
                if (filters.priceRange.includes("+")) {
                    return minPrice >= 600;
                }
                return minPrice >= min && minPrice <= max;
            });
        }
        
        return shops;
    },

    async createBooking(bookingData) {
        return new Promise(resolve => {
            setTimeout(() => {
                const booking = {
                    id: "BOOK" + Date.now(),
                    ...bookingData,
                    createdAt: new Date().toISOString()
                };
                resolve(booking);
            }, 500);
        });
    },

    async processPayment(paymentData) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: true,
                    transactionId: "TXN" + Date.now(),
                    ...paymentData
                });
            }, 1000);
        });
    }
};

const Storage = {
    saveUser(details) {
        localStorage.setItem("neartime_user", JSON.stringify(details));
    },
    getUser() {
        return JSON.parse(localStorage.getItem("neartime_user") || "{}");
    },
    saveLastBooking(booking) {
        localStorage.setItem("neartime_last_booking", JSON.stringify(booking));
    },
    getLastBooking() {
        return JSON.parse(localStorage.getItem("neartime_last_booking") || "null");
    }
};

const Analytics = {
    trackEvent(eventName, data = {}) {
        console.log(`[Analytics] ${eventName}:`, data);
    }
};

const Notifications = {
    show(message, type = "success") {
        const notification = document.getElementById("notification");
        const notificationText = document.getElementById("notificationText");
        
        notification.className = `notification ${type} show`;
        notificationText.textContent = message;
        
        setTimeout(() => {
            notification.classList.remove("show");
        }, 3000);
    }
};

function init() {
    loadUserData();
    setupEventListeners();
    renderSearchResults(barberShops);
    Analytics.trackEvent("page_viewed");
}

function loadUserData() {
    const user = Storage.getUser();
    if (user.name) {
        state.customerDetails = user;
    }
}

function setupEventListeners() {
    document.getElementById("heroSearchBtn")?.addEventListener("click", handleHeroSearch);
    document.getElementById("searchBtn")?.addEventListener("click", handleSearch);
    document.getElementById("langToggle")?.addEventListener("click", toggleLanguage);
    document.getElementById("bookNowHeader")?.addEventListener("click", openBookingModal);
    document.getElementById("ctaBookNow")?.addEventListener("click", openBookingModal);
    document.getElementById("closeBookingModal")?.addEventListener("click", closeBookingModal);
    document.getElementById("bookingModal")?.addEventListener("click", (e) => {
        if (e.target.id === "bookingModal") closeBookingModal();
    });
    document.getElementById("contactForm")?.addEventListener("submit", handleContactSubmit);
    document.getElementById("customerDetailsForm")?.addEventListener("submit", handleCustomerDetails);
    document.getElementById("proceedToPayment")?.addEventListener("click", () => goToStep(6));
    document.getElementById("doneBooking")?.addEventListener("click", closeBookingModal);
    
    document.querySelectorAll(".payment-option").forEach(option => {
        option.addEventListener("click", () => selectPaymentMethod(option.dataset.method));
    });
}

function handleHeroSearch() {
    const location = document.getElementById("heroLocation").value;
    if (location) {
        document.getElementById("searchLocation").value = location;
        document.getElementById("search").scrollIntoView({ behavior: "smooth" });
    }
}

async function handleSearch() {
    state.searchFilters = {
        location: document.getElementById("searchLocation").value,
        service: document.getElementById("searchService").value,
        priceRange: document.getElementById("searchPrice").value,
        rating: parseFloat(document.getElementById("searchRating").value) || 0
    };

    const results = await API.getShops(state.searchFilters);
    renderSearchResults(results);
    
    Analytics.trackEvent("search_performed", state.searchFilters);
}

function renderSearchResults(shops) {
    const resultsGrid = document.getElementById("resultsGrid");
    const noResults = document.getElementById("noResults");
    
    if (shops.length === 0) {
        resultsGrid.innerHTML = "";
        noResults.style.display = "block";
        return;
    }
    
    noResults.style.display = "none";
    resultsGrid.innerHTML = shops.map(shop => `
        <div class="shop-card">
            <div class="shop-image">
                <i class="fas fa-cut"></i>
                <div class="shop-rating">
                    <i class="fas fa-star"></i>
                    ${shop.rating}
                </div>
            </div>
            <div class="shop-info">
                <h3 class="shop-name">${shop.name}</h3>
                <p class="shop-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${shop.location}
                </p>
                <div class="shop-services">
                    ${shop.services.map(s => `<span class="service-tag">${capitalize(s)}</span>`).join("")}
                </div>
                <div class="shop-meta">
                    <div class="shop-price">
                        ₹${Math.min(...Object.values(shop.prices))}+ <span>/ service</span>
                    </div>
                    <button class="btn btn-primary" onclick="openBookingModal(${shop.id})">
                        Book Now
                    </button>
                </div>
            </div>
        </div>
    `).join("");
}

function openBookingModal(shopId = null) {
    const modal = document.getElementById("bookingModal");
    modal.classList.add("active");
    state.currentStep = 1;
    
    if (shopId) {
        state.selectedShop = barberShops.find(s => s.id === shopId) || barberShops[0];
    } else {
        state.selectedShop = barberShops[0];
    }
    
    renderShopList();
    updateStepIndicator();
    renderStepContent();
    
    document.body.style.overflow = "hidden";
    Analytics.trackEvent("booking_modal_opened");
}

function closeBookingModal() {
    const modal = document.getElementById("bookingModal");
    modal.classList.remove("active");
    document.body.style.overflow = "";
    resetBookingState();
}

function resetBookingState() {
    state.currentStep = 1;
    state.selectedSlot = null;
    state.selectedService = null;
    state.customerDetails = Storage.getUser();
}

function renderShopList() {
    const shopList = document.getElementById("shopList");
    shopList.innerHTML = barberShops.map(shop => `
        <div class="shop-option ${state.selectedShop?.id === shop.id ? "selected" : ""}" onclick="selectShop(${shop.id})">
            <div class="shop-option-image">
                <i class="fas fa-cut"></i>
            </div>
            <div class="shop-option-info">
                <h4 class="shop-option-name">${shop.name}</h4>
                <p class="shop-option-location">${shop.location}</p>
                <div class="shop-rating">
                    <i class="fas fa-star"></i> ${shop.rating} (${shop.reviews} reviews)
                </div>
            </div>
        </div>
    `).join("");
}

function selectShop(shopId) {
    state.selectedShop = barberShops.find(s => s.id === shopId);
    renderShopList();
}

function goToStep(step) {
    state.currentStep = step;
    updateStepIndicator();
    renderStepContent();
    
    if (step === 2) {
        renderSlots();
    } else if (step === 4) {
        renderServices();
    } else if (step === 5) {
        renderBookingSummary();
    }
}

function updateStepIndicator() {
    document.querySelectorAll(".step").forEach((stepEl, index) => {
        const stepNum = index + 1;
        stepEl.classList.remove("active", "completed");
        
        if (stepNum === state.currentStep) {
            stepEl.classList.add("active");
        } else if (stepNum < state.currentStep) {
            stepEl.classList.add("completed");
        }
    });
}

function renderStepContent() {
    document.querySelectorAll(".booking-step-content").forEach(content => {
        content.classList.remove("active");
    });
    
    const activeContent = document.querySelector(`.booking-step-content[data-step="${state.currentStep}"]`);
    if (activeContent) {
        activeContent.classList.add("active");
    }
}

function renderSlots() {
    const slotGrid = document.getElementById("slotGrid");
    const slots = state.selectedShop?.slots || [];
    
    slotGrid.innerHTML = slots.map((slot, index) => `
        <div class="slot-option" onclick="selectSlot('${slot}')" data-slot="${slot}">
            ${slot}
        </div>
    `).join("");
}

function selectSlot(slot) {
    state.selectedSlot = slot;
    document.querySelectorAll(".slot-option").forEach(opt => {
        opt.classList.toggle("selected", opt.dataset.slot === slot);
    });
    
    setTimeout(() => goToStep(3), 300);
}

function handleCustomerDetails(e) {
    e.preventDefault();
    
    state.customerDetails = {
        name: document.getElementById("customerName").value,
        phone: document.getElementById("customerPhone").value,
        email: document.getElementById("customerEmail").value
    };
    
    Storage.saveUser(state.customerDetails);
    goToStep(4);
    
    Analytics.trackEvent("customer_details_submitted", { step: 3 });
}

function renderServices() {
    const serviceList = document.getElementById("serviceList");
    const services = state.selectedShop?.services || [];
    const prices = state.selectedShop?.prices || {};
    
    serviceList.innerHTML = services.map(service => `
        <div class="service-option" onclick="selectService('${service}')" data-service="${service}">
            <div class="service-option-name">${capitalize(service)}</div>
            <div class="service-option-price">₹${prices[service]}</div>
        </div>
    `).join("");
    
    if (state.selectedService) {
        document.querySelectorAll(".service-option").forEach(opt => {
            opt.classList.toggle("selected", opt.dataset.service === state.selectedService);
        });
    }
}

function selectService(service) {
    state.selectedService = service;
    
    document.querySelectorAll(".service-option").forEach(opt => {
        opt.classList.toggle("selected", opt.dataset.service === service);
    });
    
    setTimeout(() => goToStep(5), 300);
}

function renderBookingSummary() {
    const summary = document.getElementById("bookingSummary");
    const price = state.selectedShop?.prices[state.selectedService] || 0;
    
    summary.innerHTML = `
        <div class="summary-item">
            <span>Barber Shop</span>
            <span>${state.selectedShop?.name}</span>
        </div>
        <div class="summary-item">
            <span>Location</span>
            <span>${state.selectedShop?.location}</span>
        </div>
        <div class="summary-item">
            <span>Date</span>
            <span>${new Date().toLocaleDateString()}</span>
        </div>
        <div class="summary-item">
            <span>Time Slot</span>
            <span>${state.selectedSlot}</span>
        </div>
        <div class="summary-item">
            <span>Service</span>
            <span>${capitalize(state.selectedService)}</span>
        </div>
        <div class="summary-item">
            <span>Customer Name</span>
            <span>${state.customerDetails.name}</span>
        </div>
        <div class="summary-item">
            <span>Phone</span>
            <span>${state.customerDetails.phone}</span>
        </div>
        <div class="summary-item summary-total">
            <span>Total Amount</span>
            <span>₹${price}</span>
        </div>
    `;
}

let selectedPaymentMethod = null;

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    document.querySelectorAll(".payment-option").forEach(opt => {
        opt.classList.toggle("selected", opt.dataset.method === method);
    });
    
    const paymentDetails = document.getElementById("paymentDetails");
    
    if (method === "upi") {
        paymentDetails.innerHTML = `
            <div class="form-group">
                <label>UPI ID</label>
                <input type="text" id="upiId" placeholder="yourname@upi">
            </div>
            <button class="btn btn-primary" onclick="processPayment()">Pay Now</button>
        `;
    } else if (method === "wallet") {
        paymentDetails.innerHTML = `
            <div class="form-group">
                <label>Select Wallet</label>
                <select id="walletType">
                    <option value="paytm">Paytm</option>
                    <option value="phonepe">PhonePe</option>
                    <option value="mobikwik">MobiKwik</option>
                </select>
            </div>
            <button class="btn btn-primary" onclick="processPayment()">Pay Now</button>
        `;
    } else if (method === "card") {
        paymentDetails.innerHTML = `
            <div class="form-group">
                <label>Card Number</label>
                <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456">
            </div>
            <div class="form-group">
                <label>Expiry Date</label>
                <input type="text" id="cardExpiry" placeholder="MM/YY">
            </div>
            <div class="form-group">
                <label>CVV</label>
                <input type="password" id="cardCvv" placeholder="123">
            </div>
            <button class="btn btn-primary" onclick="processPayment()">Pay Now</button>
        `;
    }
}

async function processPayment() {
    if (!selectedPaymentMethod) {
        Notifications.show("Please select a payment method", "error");
        return;
    }
    
    const price = state.selectedShop?.prices[state.selectedService] || 0;
    
    const paymentData = {
        bookingId: "BOOK" + Date.now(),
        amount: price,
        method: selectedPaymentMethod,
        customerEmail: state.customerDetails.email
    };
    
    const result = await API.processPayment(paymentData);
    
    if (result.success) {
        const booking = {
            id: paymentData.bookingId,
            shop: state.selectedShop,
            slot: state.selectedSlot,
            service: state.selectedService,
            customer: state.customerDetails,
            amount: price,
            paymentMethod: selectedPaymentMethod,
            transactionId: result.transactionId,
            date: new Date().toISOString()
        };
        
        Storage.saveLastBooking(booking);
        renderConfirmation(booking);
        goToStep(7);
        
        Analytics.trackEvent("booking_completed", {
            shopId: state.selectedShop?.id,
            amount: price,
            paymentMethod: selectedPaymentMethod
        });
        
        Notifications.show("Payment successful! Booking confirmed.", "success");
    }
}

function renderConfirmation(booking) {
    const confirmation = document.getElementById("bookingConfirmation");
    
    confirmation.innerHTML = `
        <div class="confirmation-item">
            <span>Booking ID</span>
            <span>${booking.id}</span>
        </div>
        <div class="confirmation-item">
            <span>Shop</span>
            <span>${booking.shop.name}</span>
        </div>
        <div class="confirmation-item">
            <span>Service</span>
            <span>${capitalize(booking.service)}</span>
        </div>
        <div class="confirmation-item">
            <span>Time</span>
            <span>${booking.slot}</span>
        </div>
        <div class="confirmation-item">
            <span>Amount Paid</span>
            <span>₹${booking.amount}</span>
        </div>
        <div class="confirmation-item">
            <span>Transaction ID</span>
            <span>${booking.transactionId}</span>
        </div>
    `;
}

function toggleLanguage() {
    state.currentLanguage = state.currentLanguage === "en" ? "hi" : "en";
    
    const langBtn = document.getElementById("langToggle");
    langBtn.textContent = state.currentLanguage === "en" ? "हिंदी" : "English";
    
    document.querySelectorAll("[data-en]").forEach(el => {
        const key = state.currentLanguage === "en" ? "en" : "hi";
        if (el.dataset[key]) {
            el.textContent = el.dataset[key];
        }
    });
    
    document.querySelectorAll("[data-en-placeholder]").forEach(el => {
        const key = state.currentLanguage === "en" ? "en" : "hi";
        if (el.dataset[key + "Placeholder"]) {
            el.placeholder = el.dataset[key + "Placeholder"];
        }
    });
    
    Analytics.trackEvent("language_changed", { language: state.currentLanguage });
}

function handleContactSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById("contactName").value;
    const email = document.getElementById("contactEmail").value;
    const message = document.getElementById("contactMessage").value;
    
    console.log("Contact Form Submitted:", { name, email, message });
    
    Notifications.show("Message sent successfully! We'll get back to you soon.", "success");
    e.target.reset();
    
    Analytics.trackEvent("contact_form_submitted");
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

document.addEventListener("DOMContentLoaded", init);

window.neartime = {
    state,
    api: API,
    storage: Storage,
    notifications: Notifications,
    openBookingModal
};
