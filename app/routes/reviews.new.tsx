import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { ArrowLeft, BookOpen, ImagePlus, Save, X } from "lucide-react";
import { useState } from "react";
import DashboardLayout from "~/components/DashboardLayout";
import { createReview, getStudents, getTemplateById, getTemplates } from "~/data/store";

export const loader = async () => {
  const students = getStudents();
  const templates = getTemplates();
  return json({ students, templates });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();

  const studentId = formData.get("studentId") as string;
  const templateId = formData.get("templateId") as string;
  const classDate = formData.get("classDate") as string;
  const classTime = formData.get("classTime") as string;
  const observation = formData.get("observation") as string;
  const highlights = formData.get("highlights") as string;
  const improvements = formData.get("improvements") as string;
  const nextPractice = formData.get("nextPractice") as string;
  const artworkUrls = formData.get("artworkUrls") as string;

  const students = getStudents();
  const student = students.find((s) => s.id === studentId);
  const template = getTemplateById(templateId);

  if (!student || !template) {
    return json({ error: "学生或模板不存在" }, { status: 400 });
  }

  const artworkUrlsList = artworkUrls
    ? artworkUrls.split(",").filter((url) => url.trim())
    : [];

  const answers = template.sections.map((section) => {
    const contentMap: Record<string, string> = {
      sec1: observation,
      sec2: highlights,
      sec3: improvements,
      sec4: nextPractice,
    };
    return {
      sectionId: section.id,
      content: contentMap[section.id] || "",
    };
  });

  const review = createReview({
    studentId,
    studentName: student.name,
    courseId: student.classId,
    courseName: student.className,
    teacherId: "t1",
    teacherName: "李老师",
    templateId,
    templateName: template.name,
    classDate,
    classTime,
    artworkImageUrls: artworkUrlsList,
    highlights,
    improvements,
    observation,
    nextPractice,
    answers,
  });

  return redirect(`/reviews/${review.id}`);
};

const placeholderImages = [
  "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1579762715118-a6f1e4b96400?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1549289524-06cf898b2d3e?w=400&h=300&fit=crop",
];

export default function NewReview() {
  const { students, templates } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();

  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]?.id || "");
  const [artworkUrls, setArtworkUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  const currentTemplate = templates.find((t) => t.id === selectedTemplate);

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setArtworkUrls([...artworkUrls, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  };

  const handleAddPlaceholder = () => {
    const randomPlaceholder =
      placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
    setArtworkUrls([...artworkUrls, randomPlaceholder]);
  };

  const handleRemoveImage = (index: number) => {
    setArtworkUrls(artworkUrls.filter((_, i) => i !== index));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">新建作品点评</h1>
            <p className="text-gray-500 mt-1">按模板录入学生作品点评</p>
          </div>
        </div>

        {actionData?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {actionData.error}
          </div>
        )}

        <Form method="post" className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-primary-600" />
              基本信息
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择学生 <span className="text-red-500">*</span>
                </label>
                <select
                  name="studentId"
                  className="input-field"
                  required
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                >
                  <option value="">请选择学生</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} - {student.className}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择模板 <span className="text-red-500">*</span>
                </label>
                <select
                  name="templateId"
                  className="input-field"
                  required
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  上课日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="classDate"
                  className="input-field"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  上课时间 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="classTime"
                  className="input-field"
                  placeholder="例如：14:00-15:30"
                  required
                  defaultValue="14:00-15:30"
                />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ImagePlus size={20} className="text-primary-600" />
              作品图片
            </h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input-field flex-1"
                  placeholder="输入图片URL，或点击添加占位图"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddImage())}
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="btn-secondary"
                >
                  添加
                </button>
                <button
                  type="button"
                  onClick={handleAddPlaceholder}
                  className="btn-outline"
                >
                  添加占位图
                </button>
              </div>

              <input
                type="hidden"
                name="artworkUrls"
                value={artworkUrls.join(",")}
              />

              {artworkUrls.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {artworkUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`作品 ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {artworkUrls.length === 0 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <ImagePlus size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">暂无作品图片</p>
                  <p className="text-sm text-gray-400 mt-1">
                    可以输入图片URL或添加占位图
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              点评内容
              {currentTemplate && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  模板：{currentTemplate.name}
                </span>
              )}
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  课堂观察 <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-400 ml-2">记录孩子本节课的表现、专注度、参与度等</span>
                </label>
                <textarea
                  name="observation"
                  className="input-field resize-none"
                  rows={3}
                  required
                  placeholder="例如：今天上课非常专注，全程紧跟老师的节奏，积极回答问题..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  作品亮点 <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-400 ml-2">列举作品中最出色的地方</span>
                </label>
                <textarea
                  name="highlights"
                  className="input-field resize-none"
                  rows={3}
                  required
                  placeholder="例如：色彩搭配非常棒！大胆使用了对比色，画面很有冲击力..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  待改进之处 <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-400 ml-2">需要加强和改进的地方</span>
                </label>
                <textarea
                  name="improvements"
                  className="input-field resize-none"
                  rows={3}
                  required
                  placeholder="例如：构图还可以更饱满一些，主体物可以再大一点..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  下一步练习建议 <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-400 ml-2">给孩子课后练习建议</span>
                </label>
                <textarea
                  name="nextPractice"
                  className="input-field resize-none"
                  rows={4}
                  required
                  placeholder="1. 在家练习...&#10;2. 尝试...&#10;3. 观察..."
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              取消
            </button>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Save size={18} />
              保存点评
            </button>
          </div>
        </Form>
      </div>
    </DashboardLayout>
  );
}
