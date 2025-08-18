// gVar -> my prof is malding rn.
var patchMapping = {};

//load the worker (which loads the wasm + js wrapper)
function init() {
  var status = document.querySelector("#status");
  var output = document.getElementById("output");
  // bootstrap worker just to get initial wasm ready state
  var bootstrapWorker = new Worker("worker.js");
  patchButtonState("Loading...", true);
  // track active patch workers
  let activeWorkers = 0;
  function updateButtonPatchingState() {
    if (activeWorkers > 0) {
      patchButtonState(`Patching (${activeWorkers} remaining)...`, true);
    } else {
      patchButtonState("Patch", false);
    }
  }
  bootstrapWorker.onmessage = function (e) {
    switch (e.data.type) {
      case "wasmProgress":
        //console.log(`Wasm loading progress: ${e.data.progress}%`);
        const progressBar = document.getElementById("wasm-progress-bar");
        const progressText = document.getElementById("wasm-progress-text");

        if (progressBar && progressText) {
          progressBar.style.width = e.data.progress + "%";
          progressText.textContent = `Loading Wasm: ${e.data.progress}%`;

          // Hide the progress elements when complete
          if (e.data.progress >= 100) {
            progressBar.parentElement.style.display = "none";
            progressText.style.display = "none";
          }
        }
        break;

      case "ready":
        // initial ready enabling
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
      // ignore complete from bootstrap (it never runs patches)
    }
  };

  // pull the patches json.
  // if you dont like this, feel free to block this request with your browser, and you can supply ur own patches.
  // but as you can see later, it will always show the contents of the pending patches giving the user a chance
  // to audit it as they see fit.
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


  // EVENT LISTENERS
    // patch button listener
  document.getElementById("run-patch").addEventListener("click", function () {
    output.innerText = "";
    status.innerText = "";
    const fileList = document.getElementById("input-rom").files;
    if (!fileList || fileList.length === 0) {
      alert("Please select at least one firmware file.");
      return;
    }
    const patchesTxt = document.getElementById("patches-txt").innerText;
    activeWorkers = fileList.length;
    updateButtonPatchingState();

    Array.from(fileList).forEach((file) => {
      const worker = new Worker("worker.js");
      const state = { workerReady: false, buffer: null, finished: false };

      function finishWorker() {
        if (!state.finished) {
          state.finished = true;
          activeWorkers--;
          updateButtonPatchingState();
        }
      }

      function maybeStart() {
        if (state.workerReady && state.buffer) {
          output.innerHTML += `[${file.name}] Starting patch...\n`;
          worker.postMessage({
            type: "runPatch",
            inputRomArray: state.buffer,
            patchesTxt: patchesTxt,
          });
        }
      }

      // read the file
      const reader = new FileReader();
      reader.onload = function (e) {
        state.buffer = new Uint8Array(e.target.result);
        maybeStart();
      };
      reader.onerror = function () {
        output.innerHTML += `[${file.name}] ERROR: File read failed.\n`;
        finishWorker();
      };
      reader.readAsArrayBuffer(file);

      worker.onmessage = function (e) {
        switch (e.data.type) {
          case "wasmProgress":
            //output.innerHTML += `[${file.name}] Wasm ${e.data.progress}%\n`;
            break;
          case "ready":
            state.workerReady = true;
            maybeStart();
            break;
          case "stdout":
          case "stderr":
            output.innerHTML += `[${file.name}] ${e.data.text}\n`;
            break;
          case "error":
            output.innerHTML += `[${file.name}] ERROR: ${e.data.text}\n`;
            finishWorker();
            break;
          case "complete":
            // download output
            const blob = new Blob([e.data.data], { type: "application/octet-stream" });
            const outputRomName = file.name.replace(/(\.[^/.]+)+$/, "_patched$1");
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = outputRomName === file.name ? file.name + "_patched" : outputRomName;
            a.click();
            URL.revokeObjectURL(url);
            output.innerHTML += `[${file.name}] Patch complete -> ${a.download}\n`;
            finishWorker();
            break;
        }
      };
    });
  });

    // patch checkbox listener -> update patches
  document
    .getElementById("patches-selector")
    .addEventListener("click", function (e) {
      if (e.target.type === "checkbox") {
        refreshPatches();
      }
  });
    // when custom patches textbox is updated, refresh the patches.
  document
    .querySelector('textarea[data-patchname="custom"]')
    .addEventListener("input", function () {
      //console.log("Custom patches updated");
      refreshPatches();
  });
    // drag file listener
  document
  .addEventListener("dragover", (e) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("Files")) {
      document.body.style.backgroundColor = "#0000e1"; // Change to whatever color you want
    }
  });
    // watch for leaving the drop zone
  document
    .addEventListener("dragleave", (e) => {
      document.body.style.backgroundColor = ""; // Reset to original color
  });
    // drop file listener
  document
    .addEventListener("drop", (e) => {
      e.preventDefault();
      document.body.style.backgroundColor = "";
      document.getElementById("input-rom").files = e.dataTransfer.files;
  });


}
function refreshPatches() {
  //console.log("Refreshing patches...");
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

  // Show/hide custom patches textarea based on the custom checkbox
  const customCheckbox = document.querySelector(
    'input[type="checkbox"][data-patchname="custom"]',
  );
  const customTextarea = document.querySelector(
    'textarea[data-patchname="custom"]',
  );
  if (customTextarea) {
    customTextarea.style.display = customCheckbox.checked ? "block" : "none";
  }
}

// given some fetched patches, build the UI elements for each patch
function buildPatches(patches) {
  const container = document.getElementById("preset-patches");
  patches.forEach((patch) => {
    const patchDiv = document.createElement("div");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.setAttribute("data-patchname", patch.name);
    patchDiv.appendChild(checkbox);

    const nameElement = document.createElement("strong");
    nameElement.textContent = patch.name + ": ";
    patchDiv.appendChild(nameElement);

    const description = document.createElement("span");
    description.innerHTML = patch.description;
    patchDiv.appendChild(description);

    patchDiv.appendChild(document.createElement("br"));
    container.appendChild(patchDiv);

    patchMapping[patch.name] = patch.content;
  });
}

function patchButtonState(string, disabled) {
  document.getElementById("run-patch").disabled = disabled;
  document.getElementById("run-patch").innerText = string;
}