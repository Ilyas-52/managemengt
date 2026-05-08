'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase, Student } from '@/lib/supabase'
import {
  Users,
  Search,
  Loader2,
  Building2,
  Phone,
} from 'lucide-react'

// قادينا الـ Type باش يكون فيه غير داكشي اللي كاين بصح
type StudentWithAgency = Student & {
  agencies: {
    name: string
  } | null
}

export default function AllStudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<StudentWithAgency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, agency_id')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'instructor') {
          router.push(`/dashboard/agency/${profile.agency_id}`)
          return
        }

        const { data, error: fetchError } = await supabase
          .from('students')
          .select('*, agencies(name)')
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        setStudents(data as StudentWithAgency[])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [router])

  // حل مشكلة Expression expected: سدينا الـ filter مزيان
  const filteredStudents = students.filter((student) => {
    const search = searchQuery.toLowerCase()
    return student.full_name?.toLowerCase().includes(search)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">All Students</h1>
        <p className="text-gray-400 text-sm mt-1">
          Viewing {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-500" />
        </div>
        <input
          type="text"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Users className="w-10 h-10 text-gray-700" />
            <p className="text-gray-500 text-sm">No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-4">Student</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-4">Contact</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-4">Agency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-white font-medium">{student.full_name}</p>
                    </td>
                    <td className="px-4 py-4">

                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500/60" />
                        <span className="text-sm font-medium">{student.agencies?.name || 'Unknown'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}