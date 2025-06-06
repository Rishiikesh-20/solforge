const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY!;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY!;

export async function uploadToPinata(
  fileData: Uint8Array | Blob | File,
  fileName: string,
  fileType?: string
): Promise<string> {
  try {
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      throw new Error("Pinata API keys are not configured");
    }
    const formData = new FormData();
    let fileBlob: Blob;
    if (fileData instanceof Blob || fileData instanceof File) {
      fileBlob = fileData;
    } else {
      fileBlob = new Blob([fileData], {
        type: fileType || "application/octet-stream",
      });
    }

    formData.append("file", fileBlob, fileName);

    const metadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
      },
    });
    formData.append("pinataMetadata", metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append("pinataOptions", options);

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to upload to Pinata: ${response.statusText}`);
    }

    const result = await response.json();
    return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    throw error;
  }
}

export async function uploadJSONToPinata(
  jsonData: object,
  fileName: string
): Promise<string> {
  try {
    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
        body: JSON.stringify({
          pinataContent: jsonData,
          pinataMetadata: {
            name: fileName,
            keyvalues: {
              uploadedAt: new Date().toISOString(),
            },
          },
          pinataOptions: {
            cidVersion: 0,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to upload JSON to Pinata: ${response.statusText}`
      );
    }

    const result = await response.json();
    return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
  } catch (error) {
    console.error("Error uploading JSON to Pinata:", error);
    throw error;
  }
}
