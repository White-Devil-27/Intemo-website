(function () {
  var ERP_URLS = {
    "Cargowise": "https://api.cargowise.com/prq",
    "Logisys": "https://api.logisys.com/prq",
    "Shipmnts": "https://api.shipmnts.com/prq",
    "Fresa": "https://api.fresa.com/prq",
    "eBMS": "https://api.ebms.com/prq",
    "Others": "https://api.your-erp.com/prq"
  };

  var erpSelect = document.querySelector(".os-erp-select");
  var erpUrl = document.querySelector(".os-erp-url");
  if (erpSelect && erpUrl) {
    erpSelect.addEventListener("change", function () {
      erpUrl.textContent = ERP_URLS[erpSelect.value] || ERP_URLS.Others;
    });
  }

  document.querySelectorAll(".os-toggle-track").forEach(function (track) {
    track.addEventListener("click", function () {
      var isOn = track.classList.toggle("is-on");
      track.setAttribute("aria-checked", isOn ? "true" : "false");
      var label = track.closest(".os-cell-toggle").querySelector(".os-toggle-label");
      if (label) {
        label.textContent = isOn ? "Active" : "Inactive";
        label.classList.toggle("is-on", isOn);
      }
    });
  });
})();
