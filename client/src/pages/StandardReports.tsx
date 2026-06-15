import { useState } from "react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapPin, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function StandardReports() {
  const [activeTab, setActiveTab] = useState("assigned");
  const { t } = useLanguage();

  return (
    <div className="p-6 space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none">
              {t('process')}
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/standard-reports/my-report" className="cursor-pointer">
                {t('myReport')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/standard-reports/store-report" className="cursor-pointer">
                {t('storeReport')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/standard-reports/process-report" className="cursor-pointer">
                {t('processReport')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/standard-reports/organization-report" className="cursor-pointer">
                {t('organizationReport')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/standard-reports/visual-report" className="cursor-pointer">
                {t('visualReport')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/standard-reports/expired-submissions" className="cursor-pointer">
                {t('expiredSubmissions')}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span>/</span>
        <span className="text-primary font-semibold">{t('myReport')}</span>
        <span>/</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none">
              {t('learning')}
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/standard-reports/learning-my-report" className="cursor-pointer">
                {t('myReport')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/standard-reports/learning-store-report" className="cursor-pointer">
                {t('storeReport')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/standard-reports/learning-team-report" className="cursor-pointer">
                {t('teamReport')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/standard-reports/learning-org-report" className="cursor-pointer">
                {t('orgReport')}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span>/</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none">
              {t('assessments')}
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/standard-reports/assessment-report" className="cursor-pointer">
                {t('assessmentReport')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/standard-reports/assessment-org-report" className="cursor-pointer">
                {t('orgReport')}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span>/</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none">
              {t('issueTickets')}
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/standard-reports/ticket-org-report" className="cursor-pointer">
                {t('orgReport')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/standard-reports/ticket-advance-search" className="cursor-pointer">
                {t('advanceSearch')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/standard-reports/ticket-tag-report" className="cursor-pointer">
                {t('tagReport')}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span>/</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none">
              {t('actionPoints')}
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/standard-reports/action-points-org-report" className="cursor-pointer">
                {t('orgReport')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/standard-reports/action-points-advance-report" className="cursor-pointer">
                {t('advanceReport')}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* User Profile Section */}
      <div className="flex items-center gap-4 p-6 bg-white shadow-sm rounded-lg border">
        <Avatar className="w-20 h-20">
          <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
          <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-red-500 text-white text-2xl font-bold">
            SH
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sayed Hussain</h2>
          <Badge variant="secondary" className="mt-2 bg-blue-100 text-blue-800 hover:bg-blue-200">
            IT Manager
          </Badge>
          <div className="flex items-center text-muted-foreground text-sm mt-2">
            <MapPin className="w-4 h-4 mr-1" />
            <span>hashibasha - Head Office</span>
          </div>
        </div>
      </div>

      {/* Tabs for Assigned and Reviewed Tasks */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-fit grid-cols-2 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger 
            value="assigned" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            {t('assignedTasks')}
          </TabsTrigger>
          <TabsTrigger 
            value="reviewed"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            {t('reviewedTasks')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="assigned" className="mt-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">{t('myTasks')}</h3>
          <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
            <p className="text-muted-foreground text-center px-8">
              {t('noTasksAvailableDateRange')}
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="reviewed" className="mt-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">{t('reviewedTasks')}</h3>
          <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
            <p className="text-muted-foreground text-center px-8">
              {t('noTasksAvailableDateRange')}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
