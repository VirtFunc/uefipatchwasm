function patchButtonState(string, disabled) {
  document.getElementById("run-patch").disabled = disabled;
  document.getElementById("run-patch").innerText = string;
}

var patchMapping = {};

function buildPatches(patches) {
  const container = document.getElementById("preset-patches");
  patches.forEach((patch) => {
    const patchDiv = document.createElement("div");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.setAttribute("data-patchname", patch.name);
    patchDiv.appendChild(checkbox);

    const description = document.createElement("span");
    description.innerHTML = patch.description;
    patchDiv.appendChild(description);

    patchDiv.appendChild(document.createElement("br"));
    container.appendChild(patchDiv);

    patchMapping[patch.name] = patch.content;
  });
}

function init() {
  var status = document.querySelector("#status");
  var output = document.getElementById("output");
  var worker = new Worker("worker.js");
  // inform the user that the worker is not ready. loading from network.
  patchButtonState("Loading...", true);
  worker.onmessage = function (e) {
    switch (e.data.type) {
      case "wasmProgress":
        const progressBar = document.getElementById("wasm-progress-bar");
        const progressText = document.getElementById("wasm-progress-text");

        if (progressBar && progressText) {
          progressBar.style.width = e.data.progress + "%";
          progressText.textContent = `Loading Wasm: ${e.data.progress}%`;

          // Hide the progress elements when complete
          if (e.data.progress === 100) {
            progressBar.parentElement.style.display = "none";
            progressText.style.display = "none";
          }
        }
        break;

      case "ready":
        // enable the patch button
        patchButtonState("Patch", false);
        break;
      case "error":
        patchButtonState("Patch", false);
        status.innerHTML = e.data.text;
        break;
      case "stdout":
      case "stderr":
        output.innerHTML += e.data.text + "\n";
        break;
      case "complete":
        var blob = new Blob([e.data.data], {
          type: "application/octet-stream",
        });
        //get file name from the input rom file name and add _patched to the filename before extension
        var inputRomName = document.getElementById("input-rom").files[0].name;
        var outputRomName = inputRomName.replace(/(\.[^/.]+)+$/, "_patched$1");
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = outputRomName;
        a.click();
        URL.revokeObjectURL(url);
        patchButtonState("Patch", false);
        break;
    }
  };

  fetch("patches.json")
    .then((response) => response.json())
    .then((data) => {
      buildPatches(data.patches);
      refreshPatches();
    })
    .catch((error) => {
      console.error("Error loading patches:", error);
      status.innerHTML = "Error loading patches.json";
    });

  document.getElementById("run-patch").addEventListener("click", function () {
    output.innerText = "";
    status.innerText = "";
    var inputRom = document.getElementById("input-rom").files[0];
    var patchesTxt = document.getElementById("patches-txt").innerText;
    if (inputRom) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var inputRomArray = new Uint8Array(e.target.result);
        patchButtonState("Patching...", true);
        worker.postMessage({
          type: "runPatch",
          inputRomArray: inputRomArray,
          patchesTxt: patchesTxt,
        });
      };
      reader.readAsArrayBuffer(inputRom);
    } else {
      alert("Please select an INPUT.ROM file.");
    }
  });
  //when any checkbox is clicked, update the preview for patches.txt
  document
    .getElementById("patches-selector")
    .addEventListener("click", function (e) {
      if (e.target.type === "checkbox") {
        refreshPatches();
      }
    });
}
function refreshPatches() {
  patchMapping["custom"] = document.querySelector(
    'textarea[data-patchname="custom"]',
  ).value;
  var patchesTxt = "";
  //loop through all the checkboxes with data-patchname, and add the corresponding patch to patchesTxt
  //patch name is a variable that is the same as the data-patchname attribute
  //so we can use it to avoid hardcoding the patch names in our loop.
  var checkboxes = document.querySelectorAll('input[type="checkbox"]');
  for (var i = 0; i < checkboxes.length; i++) {
    var patchName = checkboxes[i].getAttribute("data-patchname");
    if (checkboxes[i].checked && patchMapping[patchName]) {
      patchesTxt += patchMapping[patchName];
    }
  }
  document.getElementById("patches-txt").innerText = patchesTxt;
}

// EVENT LISTENERS
document.addEventListener("dragover", (e) => {
  e.preventDefault();
  if (e.dataTransfer.types.includes("Files")) {
    document.body.style.backgroundColor = "#0000e1"; // Change to whatever color you want
  }
});
document.addEventListener("dragleave", (e) => {
  document.body.style.backgroundColor = ""; // Reset to original color
});
document.addEventListener("drop", (e) => {
  e.preventDefault();
  document.body.style.backgroundColor = "";
  document.getElementById("input-rom").files = e.dataTransfer.files;
});
document.addEventListener("DOMContentLoaded", function () {
  refreshPatches();
});
document
  .querySelector('textarea[data-patchname="custom"]')
  .addEventListener("input", function () {
    refreshPatches();
  });
