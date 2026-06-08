import React from "react";
import toast from "react-hot-toast";

// ImageUploader is a small presentational+validation component that manages
// selecting an image file and previewing it. It does not perform the upload
// itself; CreateInvitation will call `uploadCoverImage` which returns a URL.

export default function ImageUploader({
  selectedImage,
  setSelectedImage,
  imagePreview,
  setImagePreview,
  disabled,
  showLabel = true,
  label = "Cover Image",
}) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // basic validation: image type and size (max 5MB)
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const maxBytes = 5 * 1024 * 1024; // 5MB

    if (file.size > maxBytes) {
      toast.error("Image is too large (max 5MB)");
      return;
    }

    setSelectedImage(file);

    try {
      setImagePreview(URL.createObjectURL(file));
    } catch (err) {
      console.error(err);
      setImagePreview("");
    }
  };

  return (
    <div>
      {showLabel && (
        <label style={{ display: "block", marginBottom: 8 }}>
          {label}
        </label>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled}
      />

      {disabled && (
        <p style={{ fontSize: 13, color: "#666" }}>
          Sign in to upload a custom cover image.
        </p>
      )}

      {imagePreview && (
        <div style={{ marginTop: 12 }}>
          <img
            src={imagePreview}
            alt="preview"
            style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 8 }}
          />
        </div>
      )}
    </div>
  );
}
