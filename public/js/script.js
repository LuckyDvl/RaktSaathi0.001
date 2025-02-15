// public/js/script.js
// Plain JavaScript (no Node require calls).

// Mapping of Indian states and their districts
const stateDistrictMapping = {
  "Andhra Pradesh": [
    "Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna",
    "Kurnool", "Prakasam", "Sri Potti Sriramulu Nellore",
    "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari"
  ],
  "Uttar Pradesh": [
    "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya",
    "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur",
    "Banda", "Barabanki", "Bareilly", "Basti", "Bijnor", "Budaun",
    "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah",
    "Farrukhabad", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad",
    "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras",
    "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar",
    "Kasganj", "Kaushambi", "Kushinagar", "Lakhimpur Kheri", "Lalitpur",
    "Lucknow", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut",
    "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh",
    "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar",
    "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur",
    "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"
  ],
  "Maharashtra": [
    "Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad",
    "Solapur", "Thane", "Kalyan", "Navi Mumbai", "Amravati"
  ]
};

function initFilterUI() {
  const stateSelect = document.getElementById('stateSelect');
  const districtSelect = document.getElementById('districtSelect');
  
  stateSelect.innerHTML = '<option value="">Select State</option>';
  for (const state in stateDistrictMapping) {
    const option = document.createElement('option');
    option.value = state;
    option.textContent = state;
    stateSelect.appendChild(option);
  }
  
  stateSelect.addEventListener('change', function() {
    const selectedState = this.value;
    districtSelect.innerHTML = '<option value="">Select District</option>';
    if (stateDistrictMapping[selectedState]) {
      stateDistrictMapping[selectedState].forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        districtSelect.appendChild(option);
      });
    }
  });
  
  document.getElementById('filterForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const selectedState = stateSelect.value;
    const selectedDistrict = districtSelect.value;
    applyFilter(selectedState, selectedDistrict);
  });
}

function applyFilter(filterState, filterDistrict) {
  if (window.userType === "need") {
    loadDonors(filterState, filterDistrict);
    document.getElementById('donorsSection').style.display = 'block';
    document.getElementById('requestsSection').style.display = 'none';
  } else if (window.userType === "donate") {
    loadBloodRequests(filterState, filterDistrict);
    document.getElementById('requestsSection').style.display = 'block';
    document.getElementById('donorsSection').style.display = 'none';
  } else {
    alert("Please choose if you need blood or want to donate blood first.");
  }
}

function formatAddress(addr) {
  if (!addr) return '';
  const parts = [];
  if (addr.street) parts.push(addr.street);
  if (addr.district) parts.push(addr.district);
  if (addr.state) parts.push(addr.state);
  if (addr.pinCode) parts.push(addr.pinCode);
  return parts.join(', ');
}

const slideIndexMap = {};
function plusSlides(n, containerId) {
  showSlides(slideIndexMap[containerId] + n, containerId);
}
function showSlides(n, containerId) {
  const slides = document.querySelectorAll(`#${containerId} .mySlide`);
  if (!slideIndexMap[containerId]) slideIndexMap[containerId] = 0;
  if (n >= slides.length) n = 0;
  if (n < 0) n = slides.length - 1;
  slideIndexMap[containerId] = n;
  slides.forEach((slide, i) => {
    slide.style.display = (i === n) ? 'block' : 'none';
  });
}

// -------------- Expanded Card Modal Feature -------------- //
/**
 * Opens the expanded details modal and shows all information.
 * Also includes a message box and a "Send Message" button.
 * @param {Object} data - The donor or recipient object.
 * @param {Boolean} isDonor - True if donor; false if recipient.
 */
function showExpandedDetails(data, isDonor) {
  const modal = document.getElementById('expandedCardModal');
  const detailsDiv = document.getElementById('expandedCardDetails');
  
  // Save the target user id (from the createdBy field) for sending messages later.
  window.expandedMessageTargetUserId = data.createdBy;
  
  // Build HTML string with all details.
  let html = `<h2>${isDonor ? "Donor Details" : "Recipient Details"}</h2>`;
  html += `<p><strong>Name:</strong> ${data.name}</p>`;
  if (data.fatherName) {
    html += `<p><strong>Father's Name:</strong> ${data.fatherName}</p>`;
  }
  html += `<p><strong>Age:</strong> ${data.age}</p>`;
  html += `<p><strong>Gender:</strong> ${data.gender}</p>`;
  html += `<p><strong>Mobile:</strong> ${data.mobile}</p>`;
  if (data.email) {
    html += `<p><strong>Email:</strong> ${data.email}</p>`;
  }
  if (data.bloodGroup) {
    html += `<p><strong>Blood Group:</strong> ${data.bloodGroup}</p>`;
  }
  if (data.address) {
    const addr = formatAddress(data.address);
    if (addr) {
      html += `<p><strong>Address:</strong> ${addr}</p>`;
    }
  }
  if (isDonor) {
    html += `<p><strong>Previously Donated:</strong> ${data.previouslyDonated}</p>`;
    html += `<p><strong>Health Issues:</strong> ${data.healthIssues || "None"}</p>`;
    if (data.profilePic) {
      html += `<p><img src="${data.profilePic}" alt="Profile Pic" style="max-width:200px;border-radius:5px;"></p>`;
    }
  } else {
    if (data.emergency) {
      html += `<p><strong>Emergency:</strong> ${data.emergency}</p>`;
    }
    if (data.reportsImages && data.reportsImages.length > 0) {
      html += `<p><strong>Reports Images:</strong></p>`;
      data.reportsImages.forEach(img => {
        html += `<img src="${img}" alt="Report Image" style="max-width:200px;display:block;margin:5px auto;">`;
      });
    }
    if (data.video) {
      html += `<p><strong>Video:</strong></p>`;
      html += `<video src="${data.video}" controls style="max-width:200px;display:block;margin:5px auto;"></video>`;
    }
  }
  
  // Add a message input box and a Send Message button.
  if (data.createdBy) {
    html += `
      <div id="expandedMessageContainer" style="margin-top:15px;">
        <textarea id="expandedMessageInput" placeholder="Type your message here" style="width:100%;"></textarea>
        <button onclick="sendExpandedMessage()">Send Message</button>
      </div>
    `;
  }
  
  detailsDiv.innerHTML = html;
  modal.style.display = 'flex';
}

/**
 * Sends the message typed in the expanded modal.
 */
function sendExpandedMessage() {
  const messageContent = document.getElementById('expandedMessageInput').value.trim();
  if (!messageContent) {
    alert("Please enter a message before sending.");
    return;
  }
  const token = localStorage.getItem('token');
  const receiverId = window.expandedMessageTargetUserId;
  if (!receiverId) {
    alert("Recipient information is missing.");
    return;
  }
  fetch('/api/messages', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ receiverId: receiverId, content: messageContent })
  })
  .then(response => response.json())
  .then(data => {
    alert("Message sent successfully!");
    document.getElementById('expandedMessageInput').value = '';
  })
  .catch(error => {
    console.error("Error sending message:", error);
    alert("Error sending message.");
  });
}
// ------------------------------------------------------------ //


// Start chat: redirect to chat.html with target user id in query param.
function startChat(targetUserId) {
  if (!targetUserId) {
    alert("This user is not available for messaging.");
    return;
  }
  window.location.href = "chat.html?withUserId=" + targetUserId;
}

// Load donors and render cards.
function loadDonors(filterState, filterDistrict) {
  fetch('/api/donors')
    .then(response => response.json())
    .then(donors => {
      if (filterState && filterDistrict) {
        donors = donors.filter(donor =>
          donor.address &&
          donor.address.state === filterState &&
          donor.address.district === filterDistrict
        );
      }
      let output = '<div class="donor-cards-container">';
      if (donors.length === 0) {
        output += '<p>No donors registered.</p>';
      } else {
        donors.forEach(donor => {
          const addressStr = donor.address ? formatAddress(donor.address) : '';
          output += `
            <div class="donor-card">
              <div class="donor-pic-wrapper">
                ${donor.profilePic 
                  ? `<img src="${donor.profilePic}" alt="Profile Pic" class="profile-pic-circle">`
                  : `<img src="https://via.placeholder.com/100?text=No+Pic" alt="No Pic" class="profile-pic-circle">`
                }
              </div>
              <h3 class="donor-name">${donor.name}</h3>
              <p class="donor-subtitle">${donor.bloodGroup} Blood Group</p>
              <p class="donor-info"><strong>Age:</strong> ${donor.age}</p>
              <p class="donor-info"><strong>Gender:</strong> ${donor.gender}</p>
              <p class="donor-info"><strong>Address:</strong> ${addressStr}</p>
              <p class="donor-info"><strong>Previously Donated:</strong> ${donor.previouslyDonated}</p>
              <p class="donor-info"><strong>Health Issues:</strong> ${donor.healthIssues || "None"}</p>
              <button onclick='showExpandedDetails(${JSON.stringify(donor)}, true)'>More Info</button>
              <button onclick="startChat(${donor.createdBy})">Message</button>
            </div>
          `;
        });
      }
      output += '</div>';
      document.getElementById('donorList').innerHTML = output;
    })
    .catch(error => {
      console.error("Error fetching donors:", error);
      document.getElementById('donorList').innerText = "Error loading donors.";
    });
}

// Load blood requests and render cards.
function loadBloodRequests(filterState, filterDistrict) {
  fetch('/api/requests')
    .then(response => response.json())
    .then(requests => {
      if (filterState && filterDistrict) {
        requests = requests.filter(request =>
          request.address &&
          request.address.state === filterState &&
          request.address.district === filterDistrict
        );
      }
      let output = '<div class="request-cards-container">';
      if (requests.length === 0) {
        output += '<p>No blood requests available.</p>';
      } else {
        requests.forEach(request => {
          const addressStr = request.address ? formatAddress(request.address) : '';
          let slideshowHtml = '';
          if (request.reportsImages && request.reportsImages.length > 0) {
            request.reportsImages.forEach((img, idx) => {
              slideshowHtml += `
                <div class="mySlide" style="display:${idx === 0 ? 'block' : 'none'};">
                  <img src="${img}" alt="Report Image">
                </div>
              `;
            });
          }
          if (request.video) {
            const showFirst = (!request.reportsImages || request.reportsImages.length === 0) ? 'block' : 'none';
            slideshowHtml += `
              <div class="mySlide" style="display:${showFirst};">
                <video src="${request.video}" controls></video>
              </div>
            `;
          }
          let slideshowContainer = '';
          if (slideshowHtml) {
            const containerId = `slideshow-${request.id}`;
            slideIndexMap[containerId] = 0;
            slideshowContainer = `
              <div id="${containerId}" class="slideshow-container">
                ${slideshowHtml}
                <a class="prev" onclick="plusSlides(-1, '${containerId}')">&#10094;</a>
                <a class="next" onclick="plusSlides(1, '${containerId}')">&#10095;</a>
              </div>
            `;
          }
          output += `
            <div class="request-card">
              <h3 class="request-name">${request.name}</h3>
              <p class="request-info"><strong>Age:</strong> ${request.age}</p>
              <p class="request-info"><strong>Gender:</strong> ${request.gender}</p>
              <p class="request-info"><strong>Mobile:</strong> ${request.mobile}</p>
              <p class="request-info"><strong>Blood Group:</strong> ${request.bloodGroup}</p>
              <p class="request-info"><strong>Address:</strong> ${addressStr}</p>
              <p class="request-info"><strong>Emergency:</strong> ${request.emergency}</p>
              ${slideshowContainer}
              <button onclick='showExpandedDetails(${JSON.stringify(request)}, false)'>More Info</button>
              <button onclick="startChat(${request.createdBy})">Message</button>
            </div>
          `;
        });
      }
      output += '</div>';
      document.getElementById('requestList').innerHTML = output;
    })
    .catch(error => {
      console.error("Error fetching blood requests:", error);
      document.getElementById('requestList').innerText = "Error loading blood requests.";
    });
}

initFilterUI();
