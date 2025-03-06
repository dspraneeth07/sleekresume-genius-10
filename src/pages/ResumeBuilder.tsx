import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FormValidator } from "@/components/ui/form-validator";
import { 
  Plus, Trash, ChevronLeft, ChevronRight, Sparkles, 
  User, GraduationCap, Briefcase, Code, List, FileText
} from "lucide-react";
import { ResumePreviewContent } from "./ResumePreview";
import { getAISkillSuggestions, getAIObjectiveSuggestion, getAIProjectDescription, getAIExperienceDescription } from "@/utils/geminiApi";
import LiveChat from "@/components/LiveChat";

interface PersonalInfo {
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  githubUrl: string;
}

interface EducationItem {
  id: string;
  school: string;
  degree: string;
  graduationDate: string;
  score?: string;
}

interface ExperienceItem {
  id: string;
  jobTitle: string;
  companyName: string;
  startDate: string;
  endDate?: string;
  description: string;
}

interface ProjectItem {
  id: string;
  title: string;
  link?: string;
  description: string;
  technologies?: string;
}

interface Skills {
  professional: string;
  technical: string;
  soft: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

const STORAGE_KEY = "resumeData";

const ResumeBuilder = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: "",
    lastName: "",
    jobTitle: "",
    email: "kasireddymanideepreddy405@gmail.com",
    phone: "9390424085",
    location: "",
    linkedinUrl: "",
    githubUrl: "",
  });
  const [education, setEducation] = useState<EducationItem[]>([{
    id: String(Date.now()),
    school: "",
    degree: "",
    graduationDate: ""
  }]);
  const [experience, setExperience] = useState<ExperienceItem[]>([{
    id: String(Date.now()),
    jobTitle: "",
    companyName: "",
    startDate: "",
    description: ""
  }]);
  const [projects, setProjects] = useState<ProjectItem[]>([{
    id: String(Date.now()),
    title: "",
    description: ""
  }]);
  const [skills, setSkills] = useState<Skills>({
    professional: "",
    technical: "",
    soft: "",
  });
  const [objective, setObjective] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [selectedTemplate, setSelectedTemplate] = useState("default");
  const [countryCode, setCountryCode] = useState("+91");

  useEffect(() => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setPersonalInfo(parsedData.personalInfo || personalInfo);
        
        setEducation(parsedData.education && parsedData.education.length > 0 
          ? parsedData.education 
          : education);
        
        setExperience(parsedData.experience && parsedData.experience.length > 0 
          ? parsedData.experience 
          : experience);
        
        setProjects(parsedData.projects && parsedData.projects.length > 0 
          ? parsedData.projects 
          : projects);
        
        setSkills(parsedData.skills || skills);
        setObjective(parsedData.objective || objective);
      } catch (error) {
        console.error("Error parsing stored resume data:", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    e.target.value = value;
    return value;
  };

  const handleTextInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z\s.,'-]/g, '');
    e.target.value = value;
    return value;
  };

  const saveData = useCallback(() => {
    const data = {
      personalInfo,
      education,
      experience,
      skills,
      objective,
      projects
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [personalInfo, education, experience, skills, objective, projects]);

  const getResumeData = useCallback(() => ({
    personalInfo,
    education,
    experience,
    skills,
    objective,
    projects
  }), [personalInfo, education, experience, skills, objective, projects]);

  const validateField = useCallback((fieldName: string, value: string) => {
    if (!value && (fieldName === 'firstName' || fieldName === 'lastName' || fieldName === 'jobTitle' || fieldName === 'email' || fieldName === 'phone' || fieldName === 'location')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    return undefined;
  }, []);

  const validateForm = useCallback(() => {
    const errors: FormErrors = {};

    for (const key of Object.keys(personalInfo)) {
      const error = validateField(key, personalInfo[key as keyof PersonalInfo]);
      if (error) {
        errors[key] = error;
      }
    }

    education.forEach((edu, index) => {
      if (!edu.school) errors[`edu_${index}_school`] = 'School is required';
      if (!edu.degree) errors[`edu_${index}_degree`] = 'Degree is required';
      if (!edu.graduationDate) errors[`edu_${index}_graduationDate`] = 'Graduation Date is required';
    });

    if (!skills.professional) errors['professional'] = 'Professional skills are required';
    if (!skills.technical) errors['technical'] = 'Technical skills are required';
    if (!skills.soft) errors['soft'] = 'Soft skills are required';

    if (!objective) errors['objective'] = 'Career Objective is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [personalInfo, education, skills, objective, validateField]);

  const handleGenerate = () => {
    const formValid = validateForm();
    
    if (!formValid) {
      if (formErrors.firstName || formErrors.lastName || formErrors.jobTitle || 
          formErrors.email || formErrors.phone || formErrors.location) {
        setActiveTab("personal");
        toast({
          title: "Missing Information",
          description: "Please fill all required fields in the Personal tab.",
          variant: "destructive"
        });
        return;
      }
      
      const hasEducationErrors = Object.keys(formErrors).some(key => key.startsWith("edu_"));
      if (hasEducationErrors) {
        setActiveTab("education");
        toast({
          title: "Missing Information",
          description: "Please fill all required fields in the Education tab.",
          variant: "destructive"
        });
        return;
      }
      
      const hasExperienceErrors = Object.keys(formErrors).some(key => key.startsWith("exp_"));
      if (hasExperienceErrors) {
        setActiveTab("experience");
        toast({
          title: "Missing Information",
          description: "Please fill all required fields in the Experience tab.",
          variant: "destructive"
        });
        return;
      }
      
      if (formErrors.professional || formErrors.technical || formErrors.soft) {
        setActiveTab("skills");
        toast({
          title: "Missing Information",
          description: "Please fill all required fields in the Skills tab.",
          variant: "destructive"
        });
        return;
      }
      
      if (formErrors.objective) {
        setActiveTab("objectives");
        toast({
          title: "Missing Information",
          description: "Please provide a career objective.",
          variant: "destructive"
        });
        return;
      }
      
      return;
    }
    
    const resumeData = getResumeData();
    
    console.log("Generating resume with data:", resumeData);
    
    saveData();
    
    toast({
      title: "Resume Generated!",
      description: "Your professional resume has been created successfully.",
    });
    
    try {
      navigate('/resume-preview', { 
        state: { 
          resumeData: JSON.parse(JSON.stringify(resumeData)) 
        } 
      });
    } catch (error) {
      console.error("Error navigating to resume preview:", error);
      
      try {
        const dataString = encodeURIComponent(JSON.stringify(resumeData));
        navigate(`/resume-preview?data=${dataString}`);
      } catch (urlError) {
        console.error("Error encoding resume data for URL:", urlError);
        toast({
          title: "Error",
          description: "Failed to generate resume. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const addEducation = () => {
    setEducation([...education, { id: String(Date.now()), school: "", degree: "", graduationDate: "" }]);
  };

  const updateEducation = (id: string, field: string, value: string) => {
    setEducation(education.map(edu =>
      edu.id === id ? { ...edu, [field]: value } : edu
    ));
  };

  const deleteEducation = (id: string) => {
    if (education.length <= 1) {
      toast({
        title: "Cannot Delete",
        description: "At least one education entry is required.",
        variant: "destructive"
      });
      return;
    }
    setEducation(education.filter(edu => edu.id !== id));
  };

  const addExperience = () => {
    setExperience([...experience, { id: String(Date.now()), jobTitle: "", companyName: "", startDate: "", description: "" }]);
  };

  const updateExperience = (id: string, field: string, value: string) => {
    setExperience(experience.map(exp =>
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const deleteExperience = (id: string) => {
    if (experience.length <= 1) {
      toast({
        title: "Cannot Delete",
        description: "At least one experience entry is required.",
        variant: "destructive"
      });
      return;
    }
    setExperience(experience.filter(exp => exp.id !== id));
  };

  const generateExperienceDescription = async (id: string) => {
    const exp = experience.find(e => e.id === id);
    
    if (!exp || !exp.jobTitle || !exp.companyName) {
      toast({
        title: "Information Required",
        description: "Please enter job title and company name first to generate a description.",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Generating Description",
        description: "AI is working on your job description...",
      });
      
      const suggestion = await getAIExperienceDescription(
        exp.jobTitle,
        exp.companyName
      );
      
      updateExperience(id, "description", suggestion);
      
      toast({
        title: "Description Generated",
        description: "AI has created a job description based on your information."
      });
    } catch (error) {
      console.error("Error generating experience description:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate job description. Please try again later.",
        variant: "destructive"
      });
    }
  };

  const addProject = () => {
    setProjects([...projects, { id: String(Date.now()), title: "", description: "" }]);
  };

  const updateProject = (id: string, field: string, value: string) => {
    setProjects(projects.map(project =>
      project.id === id ? { ...project, [field]: value } : project
    ));
  };

  const deleteProject = (id: string) => {
    if (projects.length <= 1) {
      toast({
        title: "Cannot Delete",
        description: "At least one project entry is required.",
        variant: "destructive"
      });
      return;
    }
    setProjects(projects.filter(project => project.id !== id));
  };

  const generateAISkillSuggestions = async () => {
    if (!personalInfo.jobTitle) {
      toast({
        title: "Job Title Required",
        description: "Please enter a job title first to get relevant skill suggestions.",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Generating Skills",
        description: "AI is working on your skill suggestions...",
      });
      
      const suggestions = await getAISkillSuggestions(personalInfo.jobTitle);
      setSkills(suggestions);
      
      toast({
        title: "Skills Generated",
        description: "AI has suggested skills based on your job title."
      });
    } catch (error) {
      console.error("Error generating skills:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate skills. Please try again later.",
        variant: "destructive"
      });
    }
  };

  const generateAIObjective = async () => {
    if (!personalInfo.jobTitle) {
      toast({
        title: "Job Title Required",
        description: "Please enter a job title first to generate a career objective.",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Generating Objective",
        description: "AI is working on your career objective...",
      });
      
      const suggestion = await getAIObjectiveSuggestion(
        personalInfo.jobTitle, 
        personalInfo.firstName, 
        personalInfo.lastName
      );
      
      setObjective(suggestion);
      
      toast({
        title: "Objective Generated",
        description: "AI has created a career objective based on your information."
      });
    } catch (error) {
      console.error("Error generating objective:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate career objective. Please try again later.",
        variant: "destructive"
      });
    }
  };

  const generateProjectDescription = async (id: string) => {
    const project = projects.find(p => p.id === id);
    
    if (!project || !project.title) {
      toast({
        title: "Project Title Required",
        description: "Please enter a project title first to generate a description.",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Generating Description",
        description: "AI is working on your project description...",
      });
      
      const suggestion = await getAIProjectDescription(
        project.title,
        project.technologies
      );
      
      updateProject(id, "description", suggestion);
      
      toast({
        title: "Description Generated",
        description: "AI has created a project description based on your title."
      });
    } catch (error) {
      console.error("Error generating project description:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate project description. Please try again later.",
        variant: "destructive"
      });
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Resume Builder</h1>
            <p className="text-gray-600">Create a professional resume in minutes</p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => setShowLivePreview(!showLivePreview)}
            className="whitespace-nowrap"
          >
            {showLivePreview ? "Hide Preview" : "Show Preview"}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className={showLivePreview ? "lg:col-span-7" : "lg:col-span-12"}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b">
                <TabsList className="w-full justify-start mb-2 bg-transparent p-0 h-auto">
                  <TabsTrigger 
                    value="personal" 
                    className="flex items-center gap-2 py-3 px-5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    <User className="w-4 h-4" /> Personal
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="education" 
                    className="flex items-center gap-2 py-3 px-5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    <GraduationCap className="w-4 h-4" /> Education
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="experience" 
                    className="flex items-center gap-2 py-3 px-5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    <Briefcase className="w-4 h-4" /> Experience
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="projects" 
                    className="flex items-center gap-2 py-3 px-5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    <Code className="w-4 h-4" /> Projects
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="skills" 
                    className="flex items-center gap-2 py-3 px-5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    <List className="w-4 h-4" /> Skills
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="objectives" 
                    className="flex items-center gap-2 py-3 px-5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    <FileText className="w-4 h-4" /> Objectives
                  </TabsTrigger>
                  
                  {showLivePreview && (
                    <div className="ml-auto py-3 px-5 text-sm font-medium text-muted-foreground">
                      Live Preview
                    </div>
                  )}
                </TabsList>
              </div>

              <div className="mt-6">
                <TabsContent value="personal" className="mt-0">
                  <Card className="border shadow-sm">
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-2xl font-bold">Personal Details</h2>
                          <p className="text-gray-500">Enter your personal information to get started</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-base">
                              First Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="firstName"
                              value={personalInfo.firstName}
                              onChange={e => setPersonalInfo({...personalInfo, firstName: handleTextInput(e)})}
                              placeholder="John"
                              className={formErrors.firstName ? "border-red-500" : ""}
                            />
                            <FormValidator 
                              value={personalInfo.firstName} 
                              required 
                              errorMessage="First name is required" 
                              showMessage={!!formErrors.firstName} 
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-base">
                              Last Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="lastName"
                              value={personalInfo.lastName}
                              onChange={e => setPersonalInfo({...personalInfo, lastName: handleTextInput(e)})}
                              placeholder="Doe"
                              className={formErrors.lastName ? "border-red-500" : ""}
                            />
                            <FormValidator 
                              value={personalInfo.lastName} 
                              required 
                              errorMessage="Last name is required" 
                              showMessage={!!formErrors.lastName} 
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="jobTitle" className="text-base">
                            Job Title <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="jobTitle"
                            placeholder="Front-end Developer"
                            value={personalInfo.jobTitle}
                            onChange={e => setPersonalInfo({...personalInfo, jobTitle: handleTextInput(e)})}
                            className={formErrors.jobTitle ? "border-red-500" : ""}
                          />
                          <FormValidator 
                            value={personalInfo.jobTitle} 
                            required 
                            errorMessage="Job title is required" 
                            showMessage={!!formErrors.jobTitle}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-base">
                            Email <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john.doe@example.com"
                            value={personalInfo.email}
                            onChange={e => setPersonalInfo({...personalInfo, email: e.target.value})}
                            className={formErrors.email ? "border-red-500" : ""}
                          />
                          <FormValidator value={personalInfo.email} required errorMessage="Email is required" showMessage={!!formErrors.email} />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-base">
                            Phone Number <span className="text-red-500">*</span>
                          </Label>
                          <div className="flex">
                            <Select value={countryCode} onValueChange={setCountryCode}>
                              <SelectTrigger className="w-[120px] flex-shrink-0">
                                <SelectValue placeholder="Country" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="+1">United States (+1)</SelectItem>
                                <SelectItem value="+44">United Kingdom (+44)</SelectItem>
                                <SelectItem value="+91">India (+91)</SelectItem>
                                <SelectItem value="+61">Australia (+61)</SelectItem>
                                <SelectItem value="+86">China (+86)</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="123-456-7890"
                              value={personalInfo.phone}
                              onChange={e => {
                                const value = handleNumberInput(e);
                                setPersonalInfo({...personalInfo, phone: value});
                              }}
                              className={`flex-1 ${formErrors.phone ? "border-red-500" : ""}`}
                            />
                          </div>
                          <FormValidator value={personalInfo.phone} required errorMessage="Phone number is required" showMessage={!!formErrors.phone} />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="location" className="text-base">
                            Location <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="location"
                            placeholder="San Francisco, CA"
                            value={personalInfo.location}
                            onChange={e => setPersonalInfo({...personalInfo, location: e.target.value})}
                            className={formErrors.location ? "border-red-500" : ""}
                          />
                          <FormValidator value={personalInfo.location} required errorMessage="Location is required" showMessage={!!formErrors.location} />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="githubUrl" className="text-base">
                              GitHub URL
                            </Label>
                            <Input
                              id="githubUrl"
                              type="url"
                              placeholder="https://github.com/username"
                              value={personalInfo.githubUrl}
                              onChange={e => setPersonalInfo({...personalInfo, githubUrl: e.target.value})}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="linkedinUrl" className="text-base">
                              LinkedIn URL
                            </Label>
                            <Input
                              id="linkedinUrl"
                              type="url"
                              placeholder="https://linkedin.com/in/username"
                              value={personalInfo.linkedinUrl}
                              onChange={e => setPersonalInfo({...personalInfo, linkedinUrl: e.target.value})}
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <Button onClick={() => setActiveTab("education")} className="bg-gray-900" size="lg">
                            Next <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="education" className="mt-0">
                  <Card className="border shadow-sm">
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h2 className="text-2xl font-bold">Education</h2>
                            <p className="text-gray-500">Add your educational background</p>
                          </div>
                          <Button onClick={addEducation} variant="outline" className="gap-1">
                            <Plus className="h-4 w-4" /> Add Education
                          </Button>
                        </div>

                        <div className="space-y-6">
                          {education.map((edu, index) => (
                            <Card key={edu.id} className="relative border shadow-sm">
                              {index > 0 && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="absolute right-2 top-2 h-8 w-8 text-gray-500 hover:text-red-500"
                                  onClick={() => deleteEducation(edu.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
                              <CardContent className="p-6">
                                <div className="text-sm text-gray-500 mb-3">Education #{index + 1}</div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                  <div className="space-y-2">
                                    <Label htmlFor={`school_${edu.id}`} className="text-base">
                                      School/University <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                      id={`school_${edu.id}`}
                                      placeholder="Harvard University"
                                      value={edu.school}
                                      onChange={e => updateEducation(edu.id, "school", handleTextInput(e))}
                                      className={formErrors[`edu_${index}_school`] ? "border-red-500" : ""}
                                    />
                                    <FormValidator value={edu.school} required errorMessage="School name is required" showMessage={!!formErrors[`edu_${index}_school`]} />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor={`degree_${edu.id}`} className="text-base">
                                      Degree <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                      id={`degree_${edu.id}`}
                                      placeholder="Bachelor of Science in Computer Science"
                                      value={edu.degree}
                                      onChange={e => updateEducation(edu.id, "degree", handleTextInput(e))}
                                      className={formErrors[`edu_${index}_degree`] ? "border-red-500" : ""}
                                    />
                                    <FormValidator value={edu.degree} required errorMessage="Degree is required" showMessage={!!formErrors[`edu_${index}_degree`]} />
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`graduationDate_${edu.id}`} className="text-base">
                                      Graduation Year <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                      id={`graduationDate_${edu.id}`}
                                      placeholder="2020"
                                      value={edu.graduationDate}
                                      onChange={e => {
                                        const value = handleNumberInput(e);
                                        updateEducation(edu.id, "graduationDate", value);
                                      }}
                                      className={formErrors[`edu_${index}_graduationDate`] ? "border-red-500" : ""}
                                    />
                                    <FormValidator value={edu.graduationDate} required errorMessage="Graduation year is required" showMessage={!!formErrors[`edu_${index}_graduationDate`]} />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor={`score_${edu.id}`} className="text-base">
                                      Score/GPA (Optional)
                                    </Label>
                                    <Input
                                      id={`score_${edu.id}`}
                                      placeholder="3.8/4.0"
                                      value={edu.score || ""}
                                      onChange={e => updateEducation(edu.id, "score", e.target.value)}
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        <div className="flex justify-between">
                          <Button onClick={() => setActiveTab("personal")} variant="outline" size="lg">
                            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                          </Button>
                          <Button onClick={() => setActiveTab("experience")} className="bg-gray-900" size="lg">
                            Next <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="experience" className="mt-0">
                  <Card className="border shadow-sm">
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h2 className="text-2xl font-bold">Work Experience</h2>
                            <p className="text-gray-500">Add your professional experience</p>
                          </div>
                          <Button onClick={addExperience} variant="outline" className="gap-1">
                            <Plus className="h-4 w-4" /> Add Experience
                          </Button>
                        </div>

                        <div className="space-y-6">
                          {experience.map((exp, index) => (
                            <Card key={exp.id} className="relative border shadow-sm">
                              {index > 0 && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="absolute right-2 top-2 h-8 w-8 text-gray-500 hover:text-red-500"
                                  onClick={() => deleteExperience(exp.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
                              <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                  <div className="space-y-2">
                                    <Label htmlFor={`jobTitle_${exp.id}`} className="text-base">
                                      Job Title <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                      id={`jobTitle_${exp.id}`}
                                      placeholder="Software Engineer"
                                      value={exp.jobTitle}
                                      onChange={e => updateExperience(exp.id, "jobTitle", handleTextInput(e))}
                                      className={formErrors[`exp_${index}_jobTitle`] ? "border-red-500" : ""}
                                    />
                                    <FormValidator value={exp.jobTitle} required errorMessage="Job title is required" showMessage={!!formErrors[`exp_${index}_jobTitle`]} />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor={`companyName_${exp.id}`} className="text-base">
                                      Company <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                      id={`companyName_${exp.id}`}
                                      placeholder="Google"
                                      value={exp.companyName}
                                      onChange={e => updateExperience(exp.id, "companyName", handleTextInput(e))}
                                      className={formErrors[`exp_${index}_companyName`] ? "border-red-500" : ""}
                                    />
                                    <FormValidator value={exp.companyName} required errorMessage="Company name is required" showMessage={!!formErrors[`exp_${index}_companyName`]} />
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                  <div className="space-y-2">
                                    <Label htmlFor={`startDate_${exp.id}`} className="text-base">
                                      Start Date <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                      id={`startDate_${exp.id}`}
                                      placeholder="June 2020"
                                      value={exp.startDate}
                                      onChange={e => updateExperience(exp.id, "startDate", e.target.value)}
                                      className={formErrors[`exp_${index}_startDate`] ? "border-red-500" : ""}
                                    />
                                    <FormValidator value={exp.startDate} required errorMessage="Start date is required" showMessage={!!formErrors[`exp_${index}_startDate`]} />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor={`endDate_${exp.id}`} className="text-base">
                                      End Date (or "Present")
                                    </Label>
                                    <Input
                                      id={`endDate_${exp.id}`}
                                      placeholder="Present"
                                      value={exp.endDate || ""}
                                      onChange={e => updateExperience(exp.id, "endDate", e.target.value)}
                                    />
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <Label htmlFor={`description_${exp.id}`} className="text-base">
                                      Description <span className="text-red-500">*</span>
                                    </Label>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="flex items-center gap-1"
                                      onClick={() => generateExperienceDescription(exp.id)}
                                    >
                                      <Sparkles className="h-3.5 w-3.5" />
                                      AI Suggest
                                    </Button>
                                  </div>
                                  <Textarea
                                    id={`description_${exp.id}`}
                                    placeholder="Describe your responsibilities and achievements"
                                    className={`min-h-[100px] ${formErrors[`exp_${index}_description`] ? "border-red-500" : ""}`}
                                    value={exp.description}
                                    onChange={e => updateExperience(exp.id, "description", e.target.value)}
                                  />
                                  <FormValidator 
                                    value={exp.description} 
                                    required 
                                    errorMessage="Description is required" 
                                    showMessage={!!formErrors[`exp_${index}_description`]} 
                                    maxLength={250}
                                    maxLengthMessage="Description should be no more than 250 characters (about 4 lines)"
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        
                        <div className="flex justify-between">
                          <Button onClick={() => setActiveTab("education")} variant="outline" size="lg">
                            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                          </Button>
                          <Button onClick={() => setActiveTab("projects")} className="bg-gray-900" size="lg">
                            Next <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="projects" className="mt-0">
                  <Card className="border shadow-sm">
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h2 className="text-2xl font-bold">Projects</h2>
                            <p className="text-gray-500">Add projects you've worked on</p>
                          </div>
                          <Button onClick={addProject} variant="outline" className="gap-1">
                            <Plus className="h-4 w-4" /> Add Project
                          </Button>
                        </div>

                        <div className="space-y-6">
                          {projects.map((project, index) => (
                            <Card key={project.id} className="relative border shadow-sm">
                              {index > 0 && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="absolute right-2 top-2 h-8 w-8 text-gray-500 hover:text-red-500"
                                  onClick={() => deleteProject(project.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
                              <CardContent className="p-6">
                                <div className="text-sm text-gray-500 mb-3">Project #{index + 1}</div>
                                
                                <div className="space-y-2 mb-6">
                                  <Label htmlFor={`project_title_${project.id}`} className="text-base">
                                    Project Title <span className="text-red-500">*</span>
                                  </Label>
                                  <Input
                                    id={`project_title_${project.id}`}
                                    placeholder="E-commerce Website"
                                    value={project.title}
                                    onChange={e => updateProject(project.id, "title", handleTextInput(e))}
                                    className={formErrors[`project_${index}_title`] ? "border-red-500" : ""}
                                  />
                                  <FormValidator value={project.title} required errorMessage="Project title is required" showMessage={!!formErrors[`project_${index}_title`]} />
                                </div>
                                
                                <div className="space-y-2 mb-6">
                                  <Label htmlFor={`project_link_${project.id}`} className="text-base">
                                    Project Link (Optional)
                                  </Label>
                                  <Input
                                    id={`project_link_${project.id}`}
                                    type="url"
                                    placeholder="https://github.com/username/project"
                                    value={project.link || ""}
                                    onChange={e => updateProject(project.id, "link", e.target.value)}
                                  />
                                </div>
                                
                                <div className="space-y-2 mb-6">
                                  <Label htmlFor={`project_tech_${project.id}`} className="text-base">
                                    Technologies Used (Optional)
                                  </Label>
                                  <Input
                                    id={`project_tech_${project.id}`}
                                    placeholder="React, Node.js, MongoDB"
                                    value={project.technologies || ""}
                                    onChange={e => updateProject(project.id, "technologies", e.target.value)}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <Label htmlFor={`project_description_${project.id}`} className="text-base">
                                      Description <span className="text-red-500">*</span>
                                    </Label>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="flex items-center gap-1"
                                      onClick={() => generateProjectDescription(project.id)}
                                    >
                                      <Sparkles className="h-3.5 w-3.5" />
                                      AI Suggest
                                    </Button>
                                  </div>
                                  <Textarea
                                    id={`project_description_${project.id}`}
                                    placeholder="Describe the project, your role, and achievements"
                                    className={`min-h-[100px] ${formErrors[`project_${index}_description`] ? "border-red-500" : ""}`}
                                    value={project.description}
                                    onChange={e => updateProject(project.id, "description", e.target.value)}
                                  />
                                  <FormValidator 
                                    value={project.description} 
                                    required 
                                    errorMessage="Description is required" 
                                    showMessage={!!formErrors[`project_${index}_description`]} 
                                    maxLength={250}
                                    maxLengthMessage="Description should be no more than 250 characters (about 4 lines)"
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        
                        <div className="flex justify-between">
                          <Button onClick={() => setActiveTab("experience")} variant="outline" size="lg">
                            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                          </Button>
                          <Button onClick={() => setActiveTab("skills")} className="bg-gray-900" size="lg">
                            Next <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="skills" className="mt-0">
                  <Card className="border shadow-sm">
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h2 className="text-2xl font-bold">Skills</h2>
                            <p className="text-gray-500">Add your key skills and competencies</p>
                          </div>
                          <Button 
                            onClick={generateAISkillSuggestions} 
                            variant="outline" 
                            className="gap-1"
                          >
                            <Sparkles className="h-4 w-4" /> AI Suggest Skills
                          </Button>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label htmlFor="professionalSkills" className="text-base">
                              Professional Skills <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                              id="professionalSkills"
                              placeholder="Project Management, Team Leadership, Strategic Planning"
                              className={`min-h-[100px] ${formErrors.professional ? "border-red-500" : ""}`}
                              value={skills.professional}
                              onChange={e => setSkills({...skills, professional: e.target.value})}
                            />
                            <FormValidator 
                              value={skills.professional} 
                              required 
                              errorMessage="Professional skills are required" 
                              showMessage={!!formErrors.professional}
                              maxLength={200}
                              maxLengthMessage="Professional skills should be no more than 200 characters"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="technicalSkills" className="text-base">
                              Technical Skills <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                              id="technicalSkills"
                              placeholder="JavaScript, React, Node.js"
                              className={`min-h-[100px] ${formErrors.technical ? "border-red-500" : ""}`}
                              value={skills.technical}
                              onChange={e => setSkills({...skills, technical: e.target.value})}
                            />
                            <FormValidator 
                              value={skills.technical} 
                              required 
                              errorMessage="Technical skills are required" 
                              showMessage={!!formErrors.technical}
                              maxLength={200}
                              maxLengthMessage="Technical skills should be no more than 200 characters"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="softSkills" className="text-base">
                              Soft Skills <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                              id="softSkills"
                              placeholder="Communication, Teamwork, Problem-solving"
                              className={`min-h-[100px] ${formErrors.soft ? "border-red-500" : ""}`}
                              value={skills.soft}
                              onChange={e => setSkills({...skills, soft: e.target.value})}
                            />
                            <FormValidator 
                              value={skills.soft} 
                              required 
                              errorMessage="Soft skills are required" 
                              showMessage={!!formErrors.soft}
                              maxLength={200}
                              maxLengthMessage="Soft skills should be no more than 200 characters"
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-between">
                          <Button onClick={() => setActiveTab("projects")} variant="outline" size="lg">
                            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                          </Button>
                          <Button onClick={() => setActiveTab("objectives")} className="bg-gray-900" size="lg">
                            Next <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="objectives" className="mt-0">
                  <Card className="border shadow-sm">
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h2 className="text-2xl font-bold">Career Objective</h2>
                            <p className="text-gray-500">Add a brief career objective or summary</p>
                          </div>
                          <Button 
                            onClick={generateAIObjective} 
                            variant="outline" 
                            className="gap-1"
                          >
                            <Sparkles className="h-4 w-4" /> AI Suggest
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Textarea
                            id="objective"
                            placeholder="Dedicated and innovative professional seeking to leverage my skills in..."
                            className={`min-h-[150px] ${formErrors.objective ? "border-red-500" : ""}`}
                            value={objective}
                            onChange={e => setObjective(e.target.value)}
                          />
                          <FormValidator 
                            value={objective} 
                            required 
                            errorMessage="Career objective is required" 
                            showMessage={!!formErrors.objective}
                            maxLength={250}
                            maxLengthMessage="Objective should be no more than 250 characters (about 4 lines)"
                          />
                        </div>

                        <div className="flex justify-between">
                          <Button onClick={() => setActiveTab("skills")} variant="outline" size="lg">
                            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                          </Button>
                          <Button onClick={handleGenerate} size="lg">
                            Generate Resume
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
          
          {showLivePreview && (
            <div className="lg:col-span-5">
              <div className="sticky top-20">
                <div className="bg-white border rounded-lg p-6 shadow-sm max-h-[800px] overflow-y-auto">
                  <ResumePreviewContent 
                    data={getResumeData()} 
                    templateId={selectedTemplate} 
                    isPreview={true}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <LiveChat />
    </MainLayout>
  );
};

export default ResumeBuilder;
