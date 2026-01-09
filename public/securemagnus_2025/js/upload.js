const btnOpenUploadModal = document.getElementById("openUploadModalBtn");
const btnCloseUploadModal = document.getElementById("closeModalBtn");
const uploadModalEl = document.getElementById("uploadModal");
const inputFileUpload = document.getElementById("csvFile");
const btnBrowseFiles = document.getElementById("browseBtn");
const uploadFileList = document.getElementById("fileList");
const btnClearFiles = document.getElementById("clearBtn");

// Open modal
btnOpenUploadModal.addEventListener("click", () => uploadModalEl.classList.remove("hidden"));

// Close modal
btnCloseUploadModal.addEventListener("click", () => uploadModalEl.classList.add("hidden"));

// Trigger hidden input when browse clicked
btnBrowseFiles.addEventListener("click", () => inputFileUpload.click());

// Handle multiple files
inputFileUpload.addEventListener("change", (event) => {
  Array.from(event.target.files).forEach((file) => {
    uploadFile(file);
  });
});

// Upload simulation for each file
function uploadFile(file) {
  const fileExt = file.name.split('.').pop().toUpperCase();

  // File container
  const fileContainer = document.createElement("div");
  fileContainer.className = "p-2 bg-gray-50 rounded-lg";

  fileContainer.innerHTML = `
    <div class="flex justify-between items-center text-sm text-gray-600">
      <div class="flex items-center space-x-2">
        <span class="px-2 py-1 text-xs bg-teal-100 text-teal-600 rounded">${fileExt}</span>
        <span>${file.name}</span>
      </div>
      <button class="removeBtn text-gray-400 hover:text-red-500">&times;</button>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
      <div class="progress bg-teal-500 h-2 rounded-full w-0"></div>
    </div>
    <p class="text-xs text-gray-400 mt-1">Uploading...</p>
  `;

  uploadFileList.appendChild(fileContainer);

  // Animate progress
  const progressBar = fileContainer.querySelector(".progress");
  const statusText = fileContainer.querySelector("p");
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    progressBar.style.width = `${progress}%`;
    if (progress >= 100) {
      clearInterval(interval);
      statusText.textContent = "Completed";
    }
  }, 300);

  // Remove file
  fileContainer.querySelector(".removeBtn").addEventListener("click", () => {
    uploadFileList.removeChild(fileContainer);
  });
}

// Clear all files
btnClearFiles.addEventListener("click", () => {
  uploadFileList.innerHTML = "";
  inputFileUpload.value = "";
});
