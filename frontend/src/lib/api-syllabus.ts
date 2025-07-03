// Upload a PDF syllabus for a user
export async function uploadSyllabus(pdfFile: File, username: string, llmConfig: { provider: string, apiKey: string, model: string }) {
  const formData = new FormData();
  formData.append("pdf", pdfFile);
  formData.append("username", username);
  formData.append("llm_provider", llmConfig.provider);
  formData.append("llm_api_key", llmConfig.apiKey);
  formData.append("llm_model", llmConfig.model);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/syllabus`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload syllabus");
  return res.json();
}
