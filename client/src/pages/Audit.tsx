import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, FileText } from "lucide-react";

export default function Audit() {
  const [activeTab, setActiveTab] = useState("process");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">Process</h1>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border border-gray-200 rounded-lg p-1">
            <TabsTrigger
              value="process"
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:border-sky-600 border border-transparent rounded-md px-6 py-2"
            >
              Process
            </TabsTrigger>
            <TabsTrigger
              value="audit"
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:border-sky-600 border border-transparent rounded-md px-6 py-2"
            >
              Audit
            </TabsTrigger>
            <TabsTrigger
              value="draft"
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:border-sky-600 border border-transparent rounded-md px-6 py-2"
            >
              Draft
            </TabsTrigger>
            <TabsTrigger
              value="template"
              className="data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:border-sky-600 border border-transparent rounded-md px-6 py-2"
            >
              Template Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="process" className="mt-6">
            {/* Search and Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col md:flex-row gap-4 items-start md:items-center"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1 relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search..."
                      className="pl-10 border-gray-300 focus:border-sky-500"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Search processes</p>
                </TooltipContent>
              </Tooltip>
              <div className="flex gap-3 w-full md:w-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Select defaultValue="all-status">
                      <SelectTrigger className="w-[140px] border-gray-300">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-status">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter by status</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Select defaultValue="select-category">
                      <SelectTrigger className="w-[150px] border-gray-300">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="select-category">Select Category</SelectItem>
                        <SelectItem value="category1">Category 1</SelectItem>
                        <SelectItem value="category2">Category 2</SelectItem>
                        <SelectItem value="category3">Category 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter by category</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Select defaultValue="all-periods">
                      <SelectTrigger className="w-[120px] border-gray-300">
                        <SelectValue placeholder="All Periods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-periods">All Periods</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter by time period</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="border-gray-300">
                      Status
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter by status</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </motion.div>

            {/* Empty State */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-12 flex flex-col items-center justify-center py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"
              >
                <FileText className="w-12 h-12 text-gray-400" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-gray-500 text-lg"
              >
                No processes match your criteria.
              </motion.p>
            </motion.div>
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col md:flex-row gap-4 items-start md:items-center"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1 relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search..."
                      className="pl-10 border-gray-300 focus:border-sky-500"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Search audits</p>
                </TooltipContent>
              </Tooltip>
              <div className="flex gap-3 w-full md:w-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Select defaultValue="all-status">
                      <SelectTrigger className="w-[140px] border-gray-300">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-status">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter by status</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Select defaultValue="select-category">
                      <SelectTrigger className="w-[150px] border-gray-300">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="select-category">Select Category</SelectItem>
                        <SelectItem value="category1">Category 1</SelectItem>
                        <SelectItem value="category2">Category 2</SelectItem>
                        <SelectItem value="category3">Category 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter by category</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Select defaultValue="all-periods">
                      <SelectTrigger className="w-[120px] border-gray-300">
                        <SelectValue placeholder="All Periods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-periods">All Periods</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter by time period</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="border-gray-300">
                      Status
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter by status</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-12 flex flex-col items-center justify-center py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"
              >
                <FileText className="w-12 h-12 text-gray-400" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-gray-500 text-lg"
              >
                No audits match your criteria.
              </motion.p>
            </motion.div>
          </TabsContent>

          <TabsContent value="draft" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col md:flex-row gap-4 items-start md:items-center"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1 relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search..."
                      className="pl-10 border-gray-300 focus:border-sky-500"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Search drafts</p>
                </TooltipContent>
              </Tooltip>
              <div className="flex gap-3 w-full md:w-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Select defaultValue="all-status">
                      <SelectTrigger className="w-[140px] border-gray-300">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-status">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter by status</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Select defaultValue="select-category">
                      <SelectTrigger className="w-[150px] border-gray-300">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="select-category">Select Category</SelectItem>
                        <SelectItem value="category1">Category 1</SelectItem>
                        <SelectItem value="category2">Category 2</SelectItem>
                        <SelectItem value="category3">Category 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter by category</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Select defaultValue="all-periods">
                      <SelectTrigger className="w-[120px] border-gray-300">
                        <SelectValue placeholder="All Periods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-periods">All Periods</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter by time period</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="border-gray-300">
                      Status
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter by status</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-12 flex flex-col items-center justify-center py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"
              >
                <FileText className="w-12 h-12 text-gray-400" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-gray-500 text-lg"
              >
                No drafts match your criteria.
              </motion.p>
            </motion.div>
          </TabsContent>

          <TabsContent value="template" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col md:flex-row gap-4 items-start md:items-center"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1 relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search..."
                      className="pl-10 border-gray-300 focus:border-sky-500"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Search templates</p>
                </TooltipContent>
              </Tooltip>
              <div className="flex gap-3 w-full md:w-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Select defaultValue="all-status">
                      <SelectTrigger className="w-[140px] border-gray-300">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-status">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter by status</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Select defaultValue="select-category">
                      <SelectTrigger className="w-[150px] border-gray-300">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="select-category">Select Category</SelectItem>
                        <SelectItem value="category1">Category 1</SelectItem>
                        <SelectItem value="category2">Category 2</SelectItem>
                        <SelectItem value="category3">Category 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter by category</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Select defaultValue="all-periods">
                      <SelectTrigger className="w-[120px] border-gray-300">
                        <SelectValue placeholder="All Periods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-periods">All Periods</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter by time period</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="border-gray-300">
                      Status
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter by status</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-12 flex flex-col items-center justify-center py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"
              >
                <FileText className="w-12 h-12 text-gray-400" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-gray-500 text-lg"
              >
                No templates match your criteria.
              </motion.p>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
