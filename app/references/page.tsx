'use client'

/**
 * References Page
 * 
 * Displays project bibliography and student copyright documentation.
 * Uses a tabbed interface for organized viewing.
 */

import { motion } from 'framer-motion'
import { FileText, BookOpen, Clock } from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'
import LiquidGlass from '@/components/LiquidGlass'

export default function ReferencesPage() {
    return (
        <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#0B0A0F] pt-28 pb-12 px-4 transition-colors duration-300">
            <div className="container mx-auto max-w-6xl">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-12 text-center"
                >
                    <div className="inline-flex items-center justify-center p-2 bg-[#8B6F47]/10 dark:bg-[#D4A574]/10 rounded-full mb-4">
                        <BookOpen className="w-6 h-6 text-[#8B6F47] dark:text-[#D4A574]" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-[#2C2416] dark:text-[#F5F3F0] mb-4">
                        Project References
                    </h1>
                    <p className="text-lg text-[#6B5D47] dark:text-[#B8A584] max-w-2xl mx-auto">
                        Documentation, research sources, and copyright certifications for the Communify platform.
                    </p>
                </motion.div>

                {/* Tabs System */}
                <Tabs.Root defaultValue="bibliography" className="w-full">
                    <Tabs.List className="flex flex-wrap justify-center gap-3 p-1.5 bg-[#E8E0D6] dark:bg-white/5 rounded-2xl w-fit mx-auto mb-10 shadow-inner">
                        <Tabs.Trigger
                            value="bibliography"
                            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300
                         data-[state=active]:bg-white dark:data-[state=active]:bg-[#1F1B28]
                         data-[state=active]:text-[#8B6F47] dark:data-[state=active]:text-[#D4A574]
                         data-[state=active]:shadow-lg text-[#6B5D47] dark:text-[#B8A584]
                         hover:text-[#8B6F47] dark:hover:text-[#D4A574]"
                        >
                            <BookOpen className="w-4 h-4" />
                            Bibliography
                        </Tabs.Trigger>
                        <Tabs.Trigger
                            value="copyright"
                            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300
                         data-[state=active]:bg-white dark:data-[state=active]:bg-[#1F1B28]
                         data-[state=active]:text-[#8B6F47] dark:data-[state=active]:text-[#D4A574]
                         data-[state=active]:shadow-lg text-[#6B5D47] dark:text-[#B8A584]
                         hover:text-[#8B6F47] dark:hover:text-[#D4A574]"
                        >
                            <FileText className="w-4 h-4" />
                            Copyright Checklist
                        </Tabs.Trigger>
                    </Tabs.List>

                    {/* Bibliography Tab */}
                    <Tabs.Content value="bibliography" className="focus:outline-none">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <LiquidGlass intensity="medium">
                                <div className="p-2 h-[850px] rounded-[2rem] overflow-hidden bg-white/40 dark:bg-black/20 border border-white/20 dark:border-white/5 backdrop-blur-md">
                                    <iframe
                                        src="/sadasd.pdf"
                                        className="w-full h-full rounded-2xl bg-white/90 dark:bg-white/10"
                                        title="Project Bibliography"
                                    />
                                </div>
                                <div className="mt-4 flex justify-between items-center px-4">
                                    <p className="text-sm text-[#6B5D47] dark:text-[#B8A584]">
                                        Source: Communify Project Bibliography
                                    </p>
                                    <a
                                        href="/sadasd.pdf"
                                        download
                                        className="text-sm font-bold text-[#8B6F47] dark:text-[#D4A574] hover:underline flex items-center gap-1"
                                    >
                                        Download PDF
                                        <FileText className="w-3 h-3" />
                                    </a>
                                </div>
                            </LiquidGlass>
                        </motion.div>
                    </Tabs.Content>

                    {/* Copyright Checklist Tab (Placeholder) */}
                    <Tabs.Content value="copyright" className="focus:outline-none">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <LiquidGlass intensity="medium">
                                <div className="p-12 text-center h-[600px] flex flex-col items-center justify-center rounded-[2rem] bg-white/40 dark:bg-black/20 border border-white/20 dark:border-white/5 backdrop-blur-md">
                                    <div className="w-24 h-24 bg-[#8B6F47]/10 dark:bg-[#D4A574]/10 rounded-full flex items-center justify-center mb-8 animate-pulse">
                                        <Clock className="w-12 h-12 text-[#8B6F47] dark:text-[#D4A574]" />
                                    </div>
                                    <h2 className="text-3xl font-display font-bold text-[#2C2416] dark:text-[#F5F3F0] mb-4">
                                        Student Copyright Checklist
                                    </h2>
                                    <p className="text-[#6B5D47] dark:text-[#B8A584] max-w-md text-lg leading-relaxed">
                                        This section is currently being updated. The Student Copyright Checklist PDF will be available here soon for public viewing and verification.
                                    </p>
                                    <div className="mt-12 p-6 rounded-2xl border border-dashed border-[#8B6F47]/20 dark:border-[#D4A574]/20 bg-white/10 dark:bg-white/5">
                                        <p className="text-sm font-mono text-[#8B6F47] dark:text-[#D4A574]">
                                            DOCUMENT_STATUS: PENDING_UPLOAD
                                        </p>
                                    </div>
                                </div>
                            </LiquidGlass>
                        </motion.div>
                    </Tabs.Content>
                </Tabs.Root>
            </div>
        </div>
    )
}
