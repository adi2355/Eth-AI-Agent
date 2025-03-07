"use client";

import { LineChart as Chart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
];

type XAxisProps = {
  dataKey?: string;
  padding?: { left: number; right: number };
};

type YAxisProps = {
  width?: number;
  padding?: { top: number; bottom: number };
};

const CustomXAxis = ({ dataKey = "name", padding = { left: 0, right: 0 } }: XAxisProps) => (
  <XAxis dataKey={dataKey} padding={padding} />
);

const CustomYAxis = ({ width = 50, padding = { top: 20, bottom: 20 } }: YAxisProps) => (
  <YAxis width={width} padding={padding} />
);

export function Analytics() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Transaction Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <Chart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <CustomXAxis />
                <CustomYAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </Chart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}