document.addEventListener("DOMContentLoaded", async function () {
    try {
      const response = await fetch("https://assisted-symantec-serve-streams.trycloudflare.com/api/percentage-discount"); // Fetch from Remix API
      const data = await response.json();
  
      if (!data.success) {
        console.error("Error fetching discounts:", data.error);
        return;
      }
  
      const discounts = data.discounts;
      const discountList = document.getElementById("discount-list");
  
      if (discountList) {
        discountList.innerHTML = discounts
          .map(
            (discount) => `
            <tr>
              <td>${discount.min}</td>
              <td>${discount.max}</td>
              <td>${discount.percentage}%</td>
            </tr>
          `
          )
          .join("");
      }
    } catch (error) {
      console.error("Error fetching discount data:", error);
    }
  });
  