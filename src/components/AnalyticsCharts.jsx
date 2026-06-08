import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AnalyticsCharts({ invitations }) {
  const labels = invitations.map((i) => i.recipientName || i.slug || 'Invite');

  const views = invitations.map((i) => i.views || 0);
  const responses = invitations.map((i) => i.responseCount || 0);

  const data = {
    labels,
    datasets: [
      {
        label: 'Views',
        data: views,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
      {
        label: 'Responses',
        data: responses,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Invitation Analytics (per invitation)' },
    },
  };

  return (
    <div style={{ background: '#fff', padding: 16, borderRadius: 12, marginBottom: 20 }}>
      <Bar options={options} data={data} />
    </div>
  );
}
