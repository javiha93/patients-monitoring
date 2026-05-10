import { useParams } from 'react-router-dom'

export default function PatientRecord() {
  const { id } = useParams()

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Ficha de paciente #{id}</h2>
      <p className="text-slate-500">Ficha del paciente — pendiente de implementar.</p>
    </div>
  )
}
