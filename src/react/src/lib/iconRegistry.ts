import {
  AlertTriangle, AlertCircle, ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
  Bell, BellOff, Bookmark, BookOpen, Calendar, Check, CheckCircle,
  ChevronDown, ChevronRight, ChevronLeft, ChevronUp, Clock, Copy,
  CreditCard, Database, Download, Edit, Edit2, Eye, EyeOff,
  File, FileText, Filter, Flag, Globe, Grid, Heart, Home,
  Image, Info, Link, Link2, List, Lock, LogOut, Mail,
  Map, MapPin, Menu, MessageCircle, Moon, MoreHorizontal, MoreVertical,
  Package, Phone, Plus, PlusCircle, RefreshCw, Save,
  Search, Settings, Share, Shield, ShoppingCart, Sliders, Star,
  Sun, Tag, Target, Trash, Trash2, TrendingUp, TrendingDown,
  Upload, User, UserPlus, Users, Wifi, X, XCircle,
  Zap, ZoomIn, ZoomOut,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'

type IconComponent = React.ComponentType<LucideProps>

export const ICON_REGISTRY: Record<string, IconComponent> = {
  AlertTriangle, AlertCircle, ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
  Bell, BellOff, Bookmark, BookOpen, Calendar, Check, CheckCircle,
  ChevronDown, ChevronRight, ChevronLeft, ChevronUp, Clock, Copy,
  CreditCard, Database, Download, Edit, Edit2, Eye, EyeOff,
  File, FileText, Filter, Flag, Globe, Grid, Heart, Home,
  Image, Info, Link, Link2, List, Lock, LogOut, Mail,
  Map, MapPin, Menu, MessageCircle, Moon, MoreHorizontal, MoreVertical,
  Package, Phone, Plus, PlusCircle, RefreshCw, Save,
  Search, Settings, Share, Shield, ShoppingCart, Sliders, Star,
  Sun, Tag, Target, Trash, Trash2, TrendingUp, TrendingDown,
  Upload, User, UserPlus, Users, Wifi, X, XCircle,
  Zap, ZoomIn, ZoomOut,
}

export const ICON_NAMES = Object.keys(ICON_REGISTRY)
