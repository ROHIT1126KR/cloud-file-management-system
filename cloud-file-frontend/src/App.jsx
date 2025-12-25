import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);

  const fetchFiles = async () => {
    try {
      const response = await axios.get("http://localhost:5000/files");
      setFiles(response.data);
    } catch (error) {
      console.error("Failed to fetch files");
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("description", description);

    try {
      const response = await axios.post(
        "http://localhost:5000/upload",
        formData
      );
      setMessage(response.data.message);
      setDescription("");
      setFile(null);
      fetchFiles(); // refresh list
    } catch (error) {
      setMessage("Upload failed");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f5f7fa",
      padding: "40px",
      fontFamily: "Arial"
    }}>
      <div style={{
        maxWidth: "900px",
        margin: "0 auto"
      }}>
        <h1 style={{ textAlign: "center" }}>
          Cloud File Management System
        </h1>

        {/* Upload Card */}
        <div style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "30px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
        }}>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <input
            type="text"
            placeholder="File description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ marginLeft: "10px", padding: "6px", width: "300px" }}
          />

          <button
            onClick={handleUpload}
            style={{
              marginLeft: "10px",
              padding: "8px 15px",
              backgroundColor: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Upload
          </button>

          {message && <p style={{ marginTop: "10px" }}>{message}</p>}
        </div>

        {/* File List */}
        <div style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
        }}>
          <h2>Uploaded Files</h2>

          {files.length === 0 ? (
            <p>No files uploaded yet</p>
          ) : (
            <table width="100%" cellPadding="10">
              <thead>
                <tr style={{ background: "#f0f0f0" }}>
                  <th align="left">File Name</th>
                  <th align="left">Description</th>
                  <th align="left">Uploaded At</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id}>
                    <td>{file.fileName}</td>
                    <td>{file.description}</td>
                    <td>
                      {new Date(file.uploadedAt).toLocaleString()}
                    </td>
                    <td align="center">
                      <a
                        href={file.blobUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
