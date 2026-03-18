import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface StatsChartProps {
  type: 'activity' | 'grades';
  data: any[];
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const StatsChart: React.FC<StatsChartProps> = ({ type, data, colorScheme }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  console.log(theme);
  if (type === 'activity') {
    // Ако няма данни, покажи съобщение
    if (!data || data.length === 0) {
      return (
        <div className="w-full h-48 flex items-center justify-center">
          <p className="text-sm opacity-50">{t('no_activity_data') || 'Няма данни за активност'}</p>
        </div>
      );
    }

    // Дни от седмицата
    const days = [
      t('monday_short') || 'Пон',
      t('tuesday_short') || 'Вт',
      t('wednesday_short') || 'Ср',
      t('thursday_short') || 'Чет',
      t('friday_short') || 'Пет',
      t('saturday_short') || 'Съб',
      t('sunday_short') || 'Нед'
    ];
    
    // Вземаме последните 7 дни от данните
    const recentData = data.slice(0, 7);
    const maxValue = Math.max(...recentData.map(d => d.value || 0), 1);
    const minValue = Math.min(...recentData.map(d => d.value || 0), 0);
    const range = maxValue - minValue || 1;
    
    // Точки за линията
    const points = recentData.map((d, index) => {
      const x = (index / (recentData.length - 1)) * 100;
      const y = 100 - ((d.value - minValue) / range) * 80;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <div className="w-full h-48 flex flex-col">
        <div className="relative flex-1">
          {/* SVG за линията */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            {/* Линия */}
            <polyline
              points={points}
              fill="none"
              stroke={colorScheme.primary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            
            {/* Точки */}
            {recentData.map((d, index) => {
              if (!d.value) return null;
              const x = (index / (recentData.length - 1)) * 100;
              const y = 100 - ((d.value - minValue) / range) * 80;
              
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="2"
                  fill={colorScheme.primary}
                  stroke="white"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
          
          {/* Дни */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
            {days.slice(0, recentData.length).map((day, index) => (
              <div key={index} className="text-xs opacity-70">{day}</div>
            ))}
          </div>
        </div>
        
        {/* Мини статистика */}
        <div className="mt-4 flex justify-center gap-4 text-sm">
          <div>
            <span className="opacity-70">{t('highest') || 'Най-висока'}: </span>
            <span style={{ color: colorScheme.primary }}>{maxValue}</span>
          </div>
          <div>
            <span className="opacity-70">{t('average') || 'Средна'}: </span>
            <span style={{ color: colorScheme.secondary }}>
              {Math.round(recentData.reduce((sum, d) => sum + (d.value || 0), 0) / recentData.length)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  
  if (type === 'grades') {
    // Ако няма данни, покажи съобщение
    if (!data || data.length === 0) {
      return (
        <div className="w-full h-48 flex items-center justify-center">
          <p className="text-sm opacity-50">{t('no_grades_data') || 'Няма данни за оценки'}</p>
        </div>
      );
    }

    // Групираме оценките по седмици (последните 4 седмици)
    const weeks = ['1', '2', '3', '4'];
    
    // Изчисляваме средните оценки за всяка седмица
    const weeklyData = weeks.map((_week, _index) => {
      // Тук трябва да филтрирате данните според вашата логика
      // Примерно филтър по дата за съответната седмица
      const weekGrades = data.filter((grade: any) => {
        // Добавете вашата логика за филтриране по седмици
        return grade.points !== undefined;
      });
      
      const avg = weekGrades.length > 0
        ? weekGrades.reduce((sum, g) => sum + g.points, 0) / weekGrades.length
        : 0;
      
      return {
        value: avg
      };
    });
    
    const maxGrade = 10;
    const minGrade = 2;
    const range = maxGrade - minGrade;
    
    // Точки за линията
    const points = weeklyData.map((d, index) => {
      const x = (index / (weeklyData.length - 1)) * 100;
      const y = 100 - ((d.value - minGrade) / range) * 80;
      return `${x},${y}`;
    }).join(' ');
    
    // Изчисляваме общия среден успех
    const totalAverage = weeklyData.reduce((sum, d) => sum + d.value, 0) / weeklyData.length;
    
    return (
      <div className="w-full h-48 flex flex-col">
        <div className="relative flex-1">
          {/* SVG за линията */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            {/* Линия */}
            <polyline
              points={points}
              fill="none"
              stroke={colorScheme.secondary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            
            {/* Точки */}
            {weeklyData.map((d, index) => {
              if (d.value === 0) return null;
              const x = (index / (weeklyData.length - 1)) * 100;
              const y = 100 - ((d.value - minGrade) / range) * 80;
              
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="2"
                  fill={colorScheme.secondary}
                  stroke="white"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
          
          {/* Седмици */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
            {weeks.map((week, index) => (
              <div key={index} className="text-xs opacity-70">{t('week_short') || 'Седм'} {week}</div>
            ))}
          </div>
        </div>
        
        {/* Среден успех */}
        <div className="mt-4 text-center">
          <span className="opacity-70 text-sm">{t('average_grade') || 'Среден успех'}: </span>
          <span className="font-bold" style={{ color: colorScheme.primary }}>
            {totalAverage.toFixed(1)}
          </span>
        </div>
      </div>
    );
  }
  
  return null;
};

export default StatsChart;