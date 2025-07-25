import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Image,
  Video,
  Music,
  FileText,
  Code,
  Archive,
  Files,
  Database,
  LogOut,
  Cloud,
} from "lucide-react";
import { FileType, SortBy, SortOrder } from "@/types/s3Types";

interface FileManagerSidebarProps {
  onDisconnect: () => void;
  currentPath: string;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterType: FileType;
  onFilterChange: (type: FileType) => void;
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  bucketName: string;
}

export const FileManagerSidebar: React.FC<FileManagerSidebarProps> = ({
  onDisconnect,
  currentPath,
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  bucketName,
}) => {
  const filterOptions = [
    { value: "all", label: "All Files", icon: Files },
    { value: "images", label: "Images", icon: Image },
    { value: "videos", label: "Videos", icon: Video },
    { value: "audio", label: "Audio", icon: Music },
    { value: "documents", label: "Documents", icon: FileText },
    { value: "code", label: "Code", icon: Code },
    { value: "archives", label: "Archives", icon: Archive },
    { value: "others", label: "Others", icon: Files },
  ];

  return (
    <Sidebar className="w-64 border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          <Cloud className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="font-semibold text-lg">S3 Manager</h2>
            <p className="text-sm text-gray-600 truncate">{bucketName}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="space-y-0">
        <SidebarGroup className="pb-0 mb-0">
          <SidebarGroupLabel>Search & Filter</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-1 p-2 pb-0">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="pt-3">
          <SidebarGroupLabel>File Types</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <SidebarMenuItem key={option.value}>
                    <SidebarMenuButton
                      onClick={() => onFilterChange(option.value as FileType)}
                      className={
                        filterType === option.value
                          ? "bg-blue-100 text-blue-700"
                          : ""
                      }
                    >
                      <Icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="pt-0 -mt-2">
          <SidebarGroupLabel>Sort Options</SidebarGroupLabel>
          <SidebarGroupContent className="space-y-1 p-2">
            <Select
              value={sortBy}
              onValueChange={(value) => onSortChange(value as SortBy)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="lastModified">Modified</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() =>
                onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")
              }
            >
              {sortOrder === "asc" ? (
                <SortAsc className="h-4 w-4 mr-2" />
              ) : (
                <SortDesc className="h-4 w-4 mr-2" />
              )}
              {sortOrder === "asc" ? "Ascending" : "Descending"}
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          variant="outline"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={onDisconnect}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};
