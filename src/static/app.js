document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants list
        const participantsHeading = document.createElement('p');
        participantsHeading.innerHTML = '<strong>Participants:</strong>';
        activityCard.appendChild(participantsHeading);

        const ul = document.createElement('ul');
        ul.className = 'participants-list';

        details.participants.forEach((email) => {
          const li = document.createElement('li');
          const span = document.createElement('span');
          span.textContent = email;

          const btn = document.createElement('button');
          btn.className = 'delete-participant';
          btn.setAttribute('aria-label', `Remove ${email}`);
          btn.dataset.activity = name;
          btn.dataset.email = email;
          btn.textContent = '✖';

          li.appendChild(span);
          li.appendChild(btn);
          ul.appendChild(li);
        });

        activityCard.appendChild(ul);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show new participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();

  // Handle delete participant clicks (event delegation)
  activitiesList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.delete-participant');
    if (!btn) return;

    const activity = btn.dataset.activity;
    const email = btn.dataset.email;

    try {
      const resp = await fetch(`/activities/${encodeURIComponent(activity)}/participant?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
      const resjson = await resp.json();

      if (resp.ok) {
        // remove the participant from the DOM
        const li = btn.closest('li');
        if (li) li.remove();

        // update availability display
        const card = btn.closest('.activity-card');
        const avail = card && card.querySelector('.availability');
        if (avail) {
          const match = avail.textContent.match(/(\d+)\s+spots/);
          if (match) {
            const spots = parseInt(match[1], 10) + 1;
            avail.textContent = `Availability: ${spots} spots left`;
          }
        }

        messageDiv.textContent = resjson.message;
        messageDiv.className = 'success';
        messageDiv.classList.remove('hidden');
      } else {
        messageDiv.textContent = resjson.detail || 'Failed to remove participant';
        messageDiv.className = 'error';
        messageDiv.classList.remove('hidden');
      }
    } catch (err) {
      console.error('Error removing participant:', err);
      messageDiv.textContent = 'Failed to remove participant';
      messageDiv.className = 'error';
      messageDiv.classList.remove('hidden');
    }

    setTimeout(() => messageDiv.classList.add('hidden'), 5000);
  });
});
