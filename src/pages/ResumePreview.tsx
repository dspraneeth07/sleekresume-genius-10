
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, ArrowLeft } from "lucide-react";

const ResumePreview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [resumeData, setResumeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const dataParam = searchParams.get('data');
      
      if (!dataParam) {
        setError("No resume data found");
        setLoading(false);
        return;
      }
      
      const parsedData = JSON.parse(decodeURIComponent(dataParam));
      setResumeData(parsedData);
      setLoading(false);
    } catch (err) {
      console.error("Error parsing resume data:", err);
      setError("Error loading resume data");
      setLoading(false);
    }
  }, [searchParams]);

  const handleDownload = () => {
    // In a real application, this would generate and download a PDF
    // For now, we'll just simulate the download
    window.print();
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-12 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-pulse w-full max-w-3xl h-[800px] bg-muted rounded-md"></div>
          <p className="mt-4 text-muted-foreground">Loading your resume...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container py-12 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/builder')}>Return to Resume Builder</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const { personalInfo, education, experience, skills, objective, templateId } = resumeData || {};

  return (
    <MainLayout>
      <div className="container py-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Resume Preview</h1>
            <p className="text-muted-foreground">Review your generated resume</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/builder')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Edit Resume
            </Button>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
          <Card className="p-8 max-w-3xl w-full bg-white shadow-lg print:shadow-none">
            <div className="border-b pb-4 mb-4 text-center">
              <h2 className="text-2xl font-bold">
                {personalInfo?.firstName || ""} {personalInfo?.lastName || ""}
              </h2>
              <p className="text-primary font-medium">{personalInfo?.jobTitle || ""}</p>
              
              <div className="flex flex-wrap justify-center space-x-3 text-sm text-muted-foreground mt-2">
                {personalInfo?.email && <span>{personalInfo.email}</span>}
                {personalInfo?.phone && <span>• {personalInfo.phone}</span>}
                {personalInfo?.location && <span>• {personalInfo.location}</span>}
              </div>
            </div>
            
            {objective && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold border-b pb-1 mb-2">Career Objective</h3>
                <p className="text-sm">{objective}</p>
              </div>
            )}
            
            {personalInfo?.summary && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold border-b pb-1 mb-2">Professional Summary</h3>
                <p className="text-sm">{personalInfo.summary}</p>
              </div>
            )}
            
            {education && education.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold border-b pb-1 mb-2">Education</h3>
                <div className="space-y-4">
                  {education.map((edu: any) => (
                    <div key={edu.id}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{edu.school}</p>
                          <p className="text-sm">{edu.degree}</p>
                        </div>
                        <p className="text-sm text-right">{edu.graduationDate}</p>
                      </div>
                      {edu.score && <p className="text-sm text-muted-foreground mt-1">{edu.score}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {experience && experience.length > 0 && experience[0].jobTitle && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold border-b pb-1 mb-2">Work Experience</h3>
                <div className="space-y-4">
                  {experience
                    .filter((exp: any) => exp.jobTitle.trim() !== "")
                    .map((exp: any) => (
                    <div key={exp.id}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{exp.jobTitle}</p>
                          <p className="text-sm text-muted-foreground">{exp.companyName}</p>
                        </div>
                        <p className="text-sm text-right">
                          {exp.startDate} - {exp.endDate || "Present"}
                        </p>
                      </div>
                      {exp.description && (
                        <div className="text-sm mt-1" 
                             dangerouslySetInnerHTML={{ __html: exp.description.replace(/\n/g, '<br/>') }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {skills && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold border-b pb-1 mb-2">Skills</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {skills.professional && (
                    <div>
                      <p className="font-medium text-sm">Professional</p>
                      <p className="text-sm">{skills.professional}</p>
                    </div>
                  )}
                  {skills.technical && (
                    <div>
                      <p className="font-medium text-sm">Technical</p>
                      <p className="text-sm">{skills.technical}</p>
                    </div>
                  )}
                  {skills.soft && (
                    <div>
                      <p className="font-medium text-sm">Soft Skills</p>
                      <p className="text-sm">{skills.soft}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="text-center text-xs text-muted-foreground print:hidden mt-8">
              <p>Template: {templateId}</p>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default ResumePreview;
