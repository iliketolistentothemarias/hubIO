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
                    <h1 className="text-3xl md:text-5xl font-display font-bold text-[#2C2416] dark:text-[#F5F3F0] mb-4">
                        Project References
                    </h1>
                    <p className="text-lg text-[#6B5D47] dark:text-[#B8A584] max-w-2xl mx-auto">
                        Documentation, research sources, and copyright certifications for the Communify platform.
                    </p>
                </motion.div>

                {/* Tabs System */}
                <Tabs.Root defaultValue="bibliography" className="w-full">
                    <Tabs.List className="flex flex-wrap justify-center gap-3 p-1.5 bg-[#E8E0D6] dark:bg-white/5 rounded-2xl w-full md:w-fit mx-auto mb-10 shadow-inner">
                        <Tabs.Trigger
                            value="bibliography"
                            className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-xl text-sm font-semibold transition-all duration-300
                         data-[state=active]:bg-white dark:data-[state=active]:bg-[#1F1B28]
                         data-[state=active]:text-[#8B6F47] dark:data-[state=active]:text-[#D4A574]
                         data-[state=active]:shadow-lg text-[#6B5D47] dark:text-[#B8A584]
                         hover:text-[#8B6F47] dark:hover:text-[#D4A574]"
                        >
                            <BookOpen className="w-4 h-4" />
                            Bibliography
                        </Tabs.Trigger>
                        <Tabs.Trigger
                            value="worklog"
                            className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-xl text-sm font-semibold transition-all duration-300
                         data-[state=active]:bg-white dark:data-[state=active]:bg-[#1F1B28]
                         data-[state=active]:text-[#8B6F47] dark:data-[state=active]:text-[#D4A574]
                         data-[state=active]:shadow-lg text-[#6B5D47] dark:text-[#B8A584]
                         hover:text-[#8B6F47] dark:hover:text-[#D4A574]"
                        >
                            <Clock className="w-4 h-4" />
                            Work Log
                        </Tabs.Trigger>
                        <Tabs.Trigger
                            value="copyright"
                            className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-xl text-sm font-semibold transition-all duration-300
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
                                <div className="p-2 h-[500px] md:h-[850px] rounded-[2rem] bg-white/40 dark:bg-black/20 border border-white/20 dark:border-white/5 backdrop-blur-md">
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

                    {/* Work Log Tab */}
                    <Tabs.Content value="worklog" className="focus:outline-none">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <LiquidGlass intensity="medium">
                                <div className="p-2 h-[500px] md:h-[850px] rounded-[2rem] bg-white/40 dark:bg-black/20 border border-white/20 dark:border-white/5 backdrop-blur-md">
                                    <iframe
                                        src="/work-log.pdf"
                                        className="w-full h-full rounded-2xl bg-white/90 dark:bg-white/10"
                                        title="Work Log"
                                    />
                                </div>
                                <div className="mt-4 flex justify-between items-center px-4">
                                    <p className="text-sm text-[#6B5D47] dark:text-[#B8A584]">
                                        Source: Webmaster Work Log
                                    </p>
                                    <a
                                        href="/work-log.pdf"
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

                    {/* Copyright Checklist Tab */}
                    <Tabs.Content value="copyright" className="focus:outline-none">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <LiquidGlass intensity="medium">
                                <div className="p-2 h-[500px] md:h-[850px] rounded-[2rem] bg-white/40 dark:bg-black/20 border border-white/20 dark:border-white/5 backdrop-blur-md">
                                    <iframe
                                        src="/copyright-checklist.pdf"
                                        className="w-full h-full rounded-2xl bg-white/90 dark:bg-white/10"
                                        title="Student Copyright Checklist"
                                    />
                                </div>
                                <div className="mt-4 flex justify-between items-center px-4">
                                    <p className="text-sm text-[#6B5D47] dark:text-[#B8A584]">
                                        Source: Student Copyright Checklist
                                    </p>
                                    <a
                                        href="/copyright-checklist.pdf"
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
                </Tabs.Root>
            </div>
        </div>
    )
}
