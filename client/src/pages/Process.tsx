import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Link } from "wouter";

import { motion } from "framer-motion";

import {

  Table,

  TableBody,

  TableCell,

  TableHead,

  TableHeader,

  TableRow,

} from "@/components/ui/table";

import {

  DropdownMenu,

  DropdownMenuContent,

  DropdownMenuItem,

  DropdownMenuTrigger,

} from "@/components/ui/dropdown-menu";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { Plus, Search, Filter, ChevronDown, Download, FileText, RefreshCw, LayoutGrid, Calendar, MoreVertical } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";



export default function Process() {

  const { t } = useLanguage();

  return (

    <div className="p-6 space-y-6 font-sans antialiased">

        {/* Header */}

        <motion.div

          initial={{ opacity: 0, y: -20 }}

          animate={{ opacity: 1, y: 0 }}

          transition={{ duration: 0.5 }}

          className="flex items-center justify-between"

        >

          <div>

            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Process Management</h1>

            <p className="text-gray-600 mt-3 text-lg leading-relaxed font-medium">Manage and monitor your processes and audits</p>

          </div>

          <div className="flex items-center gap-2">

            <Tooltip>

              <TooltipTrigger asChild>

                <Button variant="outline" className="border-orange-300 hover:border-orange-500 hover:bg-orange-50">

                  <RefreshCw className="w-4 h-4 mr-2" />

                  Refresh

                </Button>

              </TooltipTrigger>

              <TooltipContent>

                <p>{t('refreshProcesses')}</p>

              </TooltipContent>

            </Tooltip>

            <Tooltip>

              <TooltipTrigger asChild>

                <Button variant="outline" className="border-orange-300 hover:border-orange-500 hover:bg-orange-50">

                  <LayoutGrid className="w-4 h-4 mr-2" />

                  View

                </Button>

              </TooltipTrigger>

              <TooltipContent>

                <p>Change View Layout</p>

              </TooltipContent>

            </Tooltip>

          </div>

        </motion.div>



        {/* Navigation Tabs */}

        <Tabs defaultValue="process" className="w-full">

          <TabsList className="grid w-full grid-cols-3 bg-transparent border-b rounded-none h-auto p-0">

            <TabsTrigger

              value="process"

              className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:bg-transparent rounded-none px-5 py-4 text-base font-semibold transition-all duration-300 ease-in-out hover:bg-gray-50"

            >

              Process

            </TabsTrigger>

            <TabsTrigger

              value="audit"

              className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:bg-transparent rounded-none px-5 py-4 text-base font-semibold transition-all duration-300 ease-in-out hover:bg-gray-50"

            >

              Audit

            </TabsTrigger>

            <TabsTrigger

              value="draft"

              className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:bg-transparent rounded-none px-5 py-4 text-base font-semibold transition-all duration-300 ease-in-out hover:bg-gray-50"

            >

              Draft

            </TabsTrigger>

          </TabsList>



          <TabsContent value="process" className="space-y-6 mt-6">

            {/* Status Cards */}

            <motion.div

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ duration: 0.4 }}

              className="grid grid-cols-7 gap-4"

            >

              {[

                { titleKey: "total", icon: FileText, color: "bg-orange-500", count: 0 },

                { titleKey: "active", icon: RefreshCw, color: "bg-green-500", count: 0 },

                { titleKey: "visible", icon: LayoutGrid, color: "bg-blue-500", count: 0 },

                { titleKey: "daily", icon: Calendar, color: "bg-purple-500", count: 0 },

                { titleKey: "weekly", icon: Calendar, color: "bg-pink-500", count: 0 },

                { titleKey: "monthly", icon: Calendar, color: "bg-indigo-500", count: 0 },

                { titleKey: "other", icon: MoreVertical, color: "bg-gray-500", count: 0 },

              ].map((item, idx) => (

                <Tooltip key={item.titleKey}>

                  <TooltipTrigger asChild>

                    <motion.div

                      initial={{ opacity: 0, y: 20 }}

                      animate={{ opacity: 1, y: 0 }}

                      transition={{ delay: idx * 0.05 }}

                      whileHover={{ scale: 1.05, y: -4 }}

                      whileTap={{ scale: 0.98 }}

                    >

                      <Card className={`hover:shadow-lg transition-shadow duration-300 cursor-pointer ${idx === 0 ? "border-2 border-orange-500 bg-gradient-to-br from-orange-50 to-white" : "bg-white"}`}>

                        <CardHeader className="pb-3">

                          <div className="flex items-center justify-between">

                            <CardTitle className="text-base font-semibold text-gray-800">{t(item.titleKey)}</CardTitle>

                            <div className={`p-2 rounded-lg ${item.color} bg-opacity-10`}>

                              <item.icon className={`w-5 h-5 ${item.color.replace('bg-', 'text-')}`} />

                            </div>

                          </div>

                        </CardHeader>

                        <CardContent>

                          <div className="text-3xl font-bold text-gray-900">{item.count}</div>

                          <div className="text-sm text-gray-600 mt-2 font-medium">{t('processes')}</div>

                        </CardContent>

                      </Card>

                    </motion.div>

                  </TooltipTrigger>

                  <TooltipContent>

                    <p>View {t(item.titleKey)} {t('processes')}</p>

                  </TooltipContent>

                </Tooltip>

              ))}

            </motion.div>



            {/* Search and Filters */}

            <motion.div

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ delay: 0.3 }}

              className="flex flex-wrap gap-4 items-center"

            >

              <Tooltip>

                <TooltipTrigger asChild>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>

                    <Button variant="outline" className="border-orange-300 hover:border-orange-500 hover:bg-orange-50">

                      <Filter className="w-4 h-4 mr-2" />

                      {t('filter')}

                    </Button>

                  </motion.div>

                </TooltipTrigger>

                <TooltipContent>

                  <p>{t('filterProcesses')}</p>

                </TooltipContent>

              </Tooltip>

              <Tooltip>

                <TooltipTrigger asChild>

                  <div className="flex-1 min-w-[300px] relative">

                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />

                    <Input placeholder={t('searchProcess')} className="pl-10 border-orange-300 focus:border-orange-500" />

                  </div>

                </TooltipTrigger>

                <TooltipContent>

                  <p>{t('searchProcessesByKeyword')}</p>

                </TooltipContent>

              </Tooltip>

              <Tooltip>

                <TooltipTrigger asChild>

                  <DropdownMenu>

                    <DropdownMenuTrigger asChild>

                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>

                        <Button variant="outline" className="border-orange-300 hover:border-orange-500 hover:bg-orange-50">

                          {t('status')}

                          <ChevronDown className="w-4 h-4 ml-2" />

                        </Button>

                      </motion.div>

                    </DropdownMenuTrigger>

                    <DropdownMenuContent>

                      <DropdownMenuItem>{t('all')}</DropdownMenuItem>

                      <DropdownMenuItem>{t('active')}</DropdownMenuItem>

                      <DropdownMenuItem>{t('inactive')}</DropdownMenuItem>

                    </DropdownMenuContent>

                  </DropdownMenu>

                </TooltipTrigger>

                <TooltipContent>

                  <p>{t('filterByStatus')}</p>

                </TooltipContent>

              </Tooltip>

              <Tooltip>

                <TooltipTrigger asChild>

                  <DropdownMenu>

                    <DropdownMenuTrigger asChild>

                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>

                        <Button variant="outline" className="border-orange-300 hover:border-orange-500 hover:bg-orange-50">

                          {t('sortBy')}

                          <ChevronDown className="w-4 h-4 ml-2" />

                        </Button>

                      </motion.div>

                    </DropdownMenuTrigger>

                    <DropdownMenuContent>

                      <DropdownMenuItem>{t('date')}</DropdownMenuItem>

                      <DropdownMenuItem>{t('title')}</DropdownMenuItem>

                      <DropdownMenuItem>{t('owner')}</DropdownMenuItem>

                    </DropdownMenuContent>

                  </DropdownMenu>

                </TooltipTrigger>

                <TooltipContent>

                  <p>{t('sortProcesses')}</p>

                </TooltipContent>

              </Tooltip>

              <Tooltip>

                <TooltipTrigger asChild>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>

                    <Button className="bg-orange-500 hover:bg-orange-600 text-white">{t('apply')}</Button>

                  </motion.div>

                </TooltipTrigger>

                <TooltipContent>

                  <p>{t('applyFilters')}</p>

                </TooltipContent>

              </Tooltip>

              <Tooltip>

                <TooltipTrigger asChild>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>

                    <Button variant="outline">{t('reset')}</Button>

                  </motion.div>

                </TooltipTrigger>

                <TooltipContent>

                  <p>{t('resetFilters')}</p>

                </TooltipContent>

              </Tooltip>

              <div className="flex-1" />

              <Tooltip>

                <TooltipTrigger asChild>

                  <DropdownMenu>

                    <DropdownMenuTrigger asChild>

                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>

                        <Button variant="outline" className="border-orange-300 hover:border-orange-500 hover:bg-orange-50">

                          <Download className="w-4 h-4 mr-2" />

                          {t('export')}

                          <ChevronDown className="w-4 h-4 ml-2" />

                        </Button>

                      </motion.div>

                    </DropdownMenuTrigger>

                    <DropdownMenuContent>

                      <DropdownMenuItem>{t('exportAsCSV')}</DropdownMenuItem>

                      <DropdownMenuItem>{t('exportAsExcel')}</DropdownMenuItem>

                      <DropdownMenuItem>{t('exportAsPDF')}</DropdownMenuItem>

                    </DropdownMenuContent>

                  </DropdownMenu>

                </TooltipTrigger>

                <TooltipContent>

                  <p>{t('exportProcesses')}</p>

                </TooltipContent>

              </Tooltip>

              <Tooltip>

                <TooltipTrigger asChild>

                  <Link href="/title-setup">

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>

                      <Button className="bg-orange-500 hover:bg-orange-600 text-white">

                        <Plus className="w-4 h-4 mr-2" />

                        {t('new')}

                      </Button>

                    </motion.div>

                  </Link>

                </TooltipTrigger>

                <TooltipContent>

                  <p>{t('createNewProcess')}</p>

                </TooltipContent>

              </Tooltip>

            </motion.div>



            {/* Table */}

            <motion.div

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ delay: 0.4 }}

            >

              <Card className="hover:shadow-lg transition-shadow duration-300 border-orange-200">

                <CardContent className="p-0">

                  <Table>

                    <TableHeader>

                      <TableRow className="bg-orange-50 hover:bg-orange-50">

                        <TableHead className="font-semibold text-gray-700">{t('formId')}</TableHead>

                        <TableHead className="font-semibold text-gray-700">{t('title')}</TableHead>

                        <TableHead className="font-semibold text-gray-700">{t('owner')}</TableHead>

                        <TableHead className="font-semibold text-gray-700">{t('creationDate')}</TableHead>

                        <TableHead className="font-semibold text-gray-700">{t('period')}</TableHead>

                        <TableHead className="font-semibold text-gray-700">{t('processTag')}</TableHead>

                        <TableHead className="font-semibold text-gray-700">{t('stores')}</TableHead>

                        <TableHead className="font-semibold text-gray-700">{t('users')}</TableHead>

                        <TableHead className="font-semibold text-gray-700">{t('assignees')}</TableHead>

                        <TableHead className="font-semibold text-gray-700">{t('status')}</TableHead>

                        <TableHead className="font-semibold text-gray-700">{t('schedule')}</TableHead>

                        <TableHead className="font-semibold text-gray-700">{t('actions')}</TableHead>

                      </TableRow>

                    </TableHeader>

                    <TableBody>

                      <TableRow className="hover:bg-orange-50 transition-colors">

                        <TableCell colSpan={12} className="text-center py-16">

                          <motion.div

                            initial={{ scale: 0 }}

                            animate={{ scale: 1 }}

                            transition={{ duration: 0.5 }}

                            className="flex flex-col items-center justify-center"

                          >

                            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">

                              <FileText className="w-10 h-10 text-orange-500" />

                            </div>

                            <p className="text-gray-600 text-xl font-semibold">{t('noProcessesAvailable')}</p>

                            <p className="text-gray-500 text-base mt-2">{t('createFirstProcess')}</p>

                          </motion.div>

                        </TableCell>

                      </TableRow>

                    </TableBody>

                  </Table>

                </CardContent>

              </Card>

            </motion.div>

          </TabsContent>



          <TabsContent value="audit">

            <motion.div

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              className="text-center py-16"

            >

              <motion.div

                initial={{ scale: 0 }}

                animate={{ scale: 1 }}

                transition={{ duration: 0.5 }}

                className="flex flex-col items-center justify-center"

              >

                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">

                  <RefreshCw className="w-10 h-10 text-orange-500" />

                </div>

                <p className="text-gray-500 text-lg font-medium">{t('auditLogs')}</p>

                <p className="text-gray-400 text-sm mt-1">{t('viewAndManageAuditTrails')}</p>

              </motion.div>

            </motion.div>

          </TabsContent>



          <TabsContent value="draft">

            <motion.div

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              className="text-center py-16"

            >

              <motion.div

                initial={{ scale: 0 }}

                animate={{ scale: 1 }}

                transition={{ duration: 0.5 }}

                className="flex flex-col items-center justify-center"

              >

                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">

                  <FileText className="w-10 h-10 text-orange-500" />

                </div>

                <p className="text-gray-500 text-lg font-medium">{t('draftProcesses')}</p>

                <p className="text-gray-400 text-sm mt-1">{t('continueWorkingOnDrafts')}</p>

              </motion.div>

            </motion.div>

          </TabsContent>

        </Tabs>

      </div>

  );

}