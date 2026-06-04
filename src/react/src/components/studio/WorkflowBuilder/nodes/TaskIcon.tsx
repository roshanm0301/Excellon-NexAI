import {
  Play, Square, GitBranch, Shuffle, RefreshCw, List, ShieldCheck,
  Columns, Zap, Clock, UserCheck, FileText, Search, Database, Hash,
  Clock3, GitCommit, Server, Table, BarChart3, Shield, Code2,
  CheckCircle, Filter, Layout, Calendar, Fingerprint, Braces, Box,
  Type, Calculator, MapPin, Lock, Key, KeyRound, Globe, Mail,
  MessageSquare, Bell, Radio, HardDrive, Cloud, SearchCode,
  GitMerge, Rss, Layers, Download, FileCode, LayoutTemplate,
  Cpu, UserCog, Plug, ArrowDownToLine, ArrowUpFromLine, Tag,
  AlignLeft, Archive, Webhook,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Play, Square, GitBranch, Shuffle, RefreshCw, List, ShieldCheck,
  Columns, Zap, Clock, UserCheck, FileText, Search, Database, Hash,
  Clock3, GitCommit, Server, Table, BarChart3, Shield, Code2,
  CheckCircle, Filter, Layout, Calendar, Fingerprint, Braces, Box,
  Type, Calculator, MapPin, Lock, Key, KeyRound, Globe, Mail,
  MessageSquare, Bell, Radio, HardDrive, Cloud, SearchCode,
  GitMerge, Rss, Layers, Download, FileCode, LayoutTemplate,
  Cpu, UserCog, Plug, ArrowDownToLine, ArrowUpFromLine, Tag,
  AlignLeft, Archive, Webhook,
}

interface TaskIconProps {
  iconName: string
  color?: string
  size?: number
}

export function TaskIcon({ iconName, color = 'currentColor', size = 16 }: TaskIconProps) {
  const Icon = ICON_MAP[iconName] ?? Box
  return <Icon size={size} color={color} />
}
