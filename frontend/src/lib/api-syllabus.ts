// Upload a PDF syllabus for a user
export async function uploadSyllabus(pdfFile: File, userId: string) {
  const formData = new FormData();
  formData.append("pdf", pdfFile);
  formData.append("user_id", userId);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/syllabus`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload syllabus");
  return res.json();
}
