"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarEngine, CustomDate, DEFAULT_CALENDAR, CalendarConfig, MonthConfig, WeekDayConfig, RecurringEvent } from "@/lib/calendar-engine";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Plus, Trash, Settings, Save, X, Snowflake, Sun } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { createCalendar, createEvent, getEvents } from "@/lib/actions";
import { useEffect } from "react";

const FANTASY_CALENDAR: CalendarConfig = {
    ...DEFAULT_CALENDAR,
    id: 'fantasy-1',
    name: 'Harptos (Forgotten Realms-ish)',
    months: [
        { name: 'Hammer', days: 30 },
        { name: 'Alturiak', days: 30 },
        { name: 'Ches', days: 30 },
        { name: 'Tarsakh', days: 30 },
        { name: 'Mirtul', days: 30 },
        { name: 'Kythorn', days: 30 },
        { name: 'Flamerule', days: 30 },
        { name: 'Eleasis', days: 30 },
        { name: 'Eleint', days: 30 },
        { name: 'Marpenoth', days: 30 },
        { name: 'Uktar', days: 30 },
        { name: 'Nightal', days: 30 },
    ],
    weekDays: [
        { name: 'First-Day' }, { name: 'Second-Day' }, { name: 'Third-Day' },
        { name: 'Fourth-Day' }, { name: 'Fifth-Day' }, { name: 'Sixth-Day' },
        { name: 'Seventh-Day' }, { name: 'Eighth-Day' }, { name: 'Ninth-Day' },
        { name: 'Tenth-Day' }
    ],
    yearSuffix: 'DR',
    recurringEvents: [
        { id: 'midwinter', name: 'Midwinter', type: 'holiday', monthIndex: 0, day: 30, color: 'bg-blue-100 text-blue-700' },
        { id: 'greengrass', name: 'Greengrass', type: 'holiday', monthIndex: 3, day: 1, color: 'bg-green-100 text-green-700' },
        { id: 'midsummer', name: 'Midsummer', type: 'holiday', monthIndex: 6, day: 15, color: 'bg-yellow-100 text-yellow-700' },
        { id: 'highharvestide', name: 'Highharvestide', type: 'holiday', monthIndex: 8, day: 30, color: 'bg-orange-100 text-orange-700' },
        { id: 'feast-moon', name: 'Feast of the Moon', type: 'holiday', monthIndex: 10, day: 1, color: 'bg-purple-100 text-purple-700' }
    ]
};

interface TimelineEvent {
    id: string;
    title: string;
    description?: string;
    startDate: CustomDate;
    endDate: CustomDate;
    duration: number;
    chapterId?: string;
}

const TEMPLATE_CALENDAR: CalendarConfig = {
    id: 'temp',
    name: 'New Custom Calendar',
    months: [{ name: 'Month 1', days: 30 }],
    weekDays: [{ name: 'Monday' }, { name: 'Tuesday' }, { name: 'Wednesday' }, { name: 'Thursday' }, { name: 'Friday' }, { name: 'Saturday' }, { name: 'Sunday' }],
    yearSuffix: 'Year',
    hasLeapYear: false,
    hoursInDay: 24,
    minutesInHour: 60,
    recurringEvents: []
};

export function CalendarWidget({ chapters = [], worldId, initialCalendars = [] }: { chapters?: { id: string; title: string; order: number }[], worldId: string, initialCalendars?: CalendarConfig[] }) {
    const [availableCalendars, setAvailableCalendars] = useState<CalendarConfig[]>(initialCalendars);

    // Default to the first available calendar or null
    const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(
        initialCalendars.length > 0 ? initialCalendars[0].id : null
    );

    const [selectedCalendar, setSelectedCalendar] = useState<CalendarConfig | null>(
        initialCalendars.length > 0 ? initialCalendars[0] : null
    );

    // Update selectedCalendar whenever ID or availableCalendars changes
    useEffect(() => {
        if (selectedCalendarId) {
            const found = availableCalendars.find(c => c.id === selectedCalendarId);
            if (found) setSelectedCalendar(found);
        } else if (availableCalendars.length > 0) {
            setSelectedCalendarId(availableCalendars[0].id);
        } else {
            setSelectedCalendar(null);
        }
    }, [selectedCalendarId, availableCalendars]);

    // View State
    const [viewMode, setViewMode] = useState<'timeline' | 'create'>(initialCalendars.length > 0 ? 'timeline' : 'create');

    // Creation Form State
    const [newCalendar, setNewCalendar] = useState<CalendarConfig>(TEMPLATE_CALENDAR);

    // Timeline State
    const [currentDate, setCurrentDate] = useState<CustomDate>({ year: 1, monthIndex: 0, day: 1 });
    const [events, setEvents] = useState<TimelineEvent[]>([]);

    // Fetch events when calendar changes
    useEffect(() => {
        if (!selectedCalendarId) return;

        async function loadEvents() {
            try {
                const fetchedEvents = await getEvents(selectedCalendarId!);
                setEvents(fetchedEvents);
            } catch (e) {
                console.error("Failed to load events", e);
            }
        }
        loadEvents();
    }, [selectedCalendarId]);

    // Form Inputs
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventDescription, setNewEventDescription] = useState('');
    const [newEventDuration, setNewEventDuration] = useState('1');
    const [selectedChapterId, setSelectedChapterId] = useState<string>('none');

    // Calendar Engine Instance
    const engine = selectedCalendar ? new CalendarEngine(selectedCalendar) : null;

    // Handlers
    const handleCalendarChange = (id: string) => {
        if (id === 'new') {
            setViewMode('create');
            setNewCalendar({ ...TEMPLATE_CALENDAR, id: `custom-${Date.now()}` });
        } else {
            setSelectedCalendarId(id);
            setViewMode('timeline');
        }
    };

    const updateNewCalendar = (field: keyof CalendarConfig, value: any) => {
        setNewCalendar(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveCalendar = async () => {
        if (!newCalendar.name) return;
        try {
            const savedCal = await createCalendar(worldId, newCalendar);
            setAvailableCalendars(prev => [...prev, savedCal]);
            setSelectedCalendarId(savedCal.id);
            setViewMode('timeline');
        } catch (e) {
            console.error("Failed to create calendar", e);
        }
    };

    const handleLoadTemplate = (template: 'default' | 'fantasy') => {
        const config = template === 'default' ? DEFAULT_CALENDAR : FANTASY_CALENDAR;
        setNewCalendar({
            ...config,
            id: `custom-${Date.now()}`,
            name: `${config.name} Copy`
        });
    };

    // Navigation Handlers
    const handleNextDay = () => {
        if (!engine) return;
        const currentAbs = engine.dateToAbsoluteDays(currentDate);
        setCurrentDate(engine.absoluteDaysToDate(currentAbs + 1));
    };

    const handlePrevDay = () => {
        if (!engine) return;
        const currentAbs = engine.dateToAbsoluteDays(currentDate);
        setCurrentDate(engine.absoluteDaysToDate(currentAbs - 1));
    };

    const handleDateChange = (field: keyof CustomDate, value: number) => {
        setCurrentDate(prev => ({ ...prev, [field]: value }));
    };

    const handleAddEvent = async () => {
        if (!newEventTitle || !selectedCalendarId || !engine) return;

        const start = { ...currentDate };
        const duration = parseInt(newEventDuration) || 1;

        const startAbs = engine.dateToAbsoluteDays(start);
        const endAbs = startAbs + duration;
        const end = engine.absoluteDaysToDate(endAbs);

        const newEventPayload = {
            title: newEventTitle,
            description: newEventDescription,
            startDate: start,
            endDate: end,
            duration: duration,
            chapterId: selectedChapterId
        };

        try {
            const savedEvent = await createEvent(selectedCalendarId, worldId, newEventPayload);

            setEvents(prev => [...prev, {
                id: savedEvent.id,
                title: savedEvent.title,
                description: savedEvent.description || undefined,
                startDate: savedEvent.startDate as unknown as CustomDate,
                endDate: savedEvent.endDate as unknown as CustomDate,
                duration: savedEvent.duration,
                chapterId: savedEvent.chapterId || undefined
            }]);

            setNewEventTitle('');
            setNewEventDescription('');
            setNewEventDuration('1');
            setSelectedChapterId('none');
        } catch (e) {
            console.error("Failed to save event", e);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-indigo-500" />
                        Timeline Manager
                    </CardTitle>
                    {viewMode === 'timeline' && (
                        <Select value={selectedCalendarId || "none"} onValueChange={handleCalendarChange}>
                            <SelectTrigger className="w-[180px] h-8 text-xs">
                                <SelectValue placeholder="Select System" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new" className="text-indigo-600 font-medium focus:text-indigo-700">
                                    <div className="flex items-center gap-2">
                                        <Plus className="h-3 w-3 mr-1" /> Create New System
                                    </div>
                                </SelectItem>
                                {availableCalendars.map(cal => (
                                    <SelectItem key={cal.id} value={cal.id}>{cal.name}</SelectItem>
                                ))}
                                {availableCalendars.length === 0 && (
                                    <SelectItem value="none" disabled>No systems found</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <CardDescription>
                    {viewMode === 'create'
                        ? "Design a custom calendar system for your world."
                        : "Manage your world's date and chronicle history."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {viewMode === 'create' ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Template Selection */}
                        <div className="flex items-center gap-2 pb-2">
                            <span className="text-xs text-muted-foreground">Start from template:</span>
                            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => handleLoadTemplate('default')}>
                                Gregorian (Modern)
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => handleLoadTemplate('fantasy')}>
                                Harptos (Fantasy)
                            </Button>
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">System Name</label>
                                <Input
                                    value={newCalendar.name}
                                    onChange={(e) => updateNewCalendar('name', e.target.value)}
                                    placeholder="e.g. Imperial Reckoning"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted-foreground">Year Suffix</label>
                                <Input
                                    value={newCalendar.yearSuffix}
                                    onChange={(e) => updateNewCalendar('yearSuffix', e.target.value)}
                                    placeholder="e.g. AD, B.E."
                                />
                            </div>
                        </div>

                        {/* Physical Constants */}
                        <div className="p-4 rounded-lg bg-muted/30 border space-y-4">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Time Constants
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground">Hours in Day</label>
                                    <Input
                                        type="number"
                                        value={newCalendar.hoursInDay}
                                        onChange={(e) => updateNewCalendar('hoursInDay', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground">Minutes in Hour</label>
                                    <Input
                                        type="number"
                                        value={newCalendar.minutesInHour}
                                        onChange={(e) => updateNewCalendar('minutesInHour', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Month Config */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-muted-foreground">Months Configuration</label>
                                <Button
                                    variant="ghost" size="sm" className="h-6 text-xs"
                                    onClick={() => updateNewCalendar('months', [...newCalendar.months, { name: 'New Month', days: 30 }])}
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Add Month
                                </Button>
                            </div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                {newCalendar.months.map((month, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <div className="bg-muted w-6 h-6 flex items-center justify-center rounded text-[10px] text-muted-foreground flex-shrink-0">
                                            {idx + 1}
                                        </div>
                                        <Input
                                            value={month.name}
                                            onChange={(e) => {
                                                const newMonths = [...newCalendar.months];
                                                newMonths[idx].name = e.target.value;
                                                updateNewCalendar('months', newMonths);
                                            }}
                                            className="h-8 text-sm"
                                            placeholder="Month Name"
                                        />
                                        <Input
                                            type="number"
                                            value={month.days}
                                            onChange={(e) => {
                                                const newMonths = [...newCalendar.months];
                                                newMonths[idx].days = parseInt(e.target.value);
                                                updateNewCalendar('months', newMonths);
                                            }}
                                            className="h-8 w-20 text-sm font-mono"
                                            placeholder="Days"
                                        />
                                        <Button
                                            variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                            onClick={() => {
                                                const newMonths = newCalendar.months.filter((_, i) => i !== idx);
                                                updateNewCalendar('months', newMonths);
                                            }}
                                            disabled={newCalendar.months.length <= 1}
                                        >
                                            <Trash className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recurring Events Config */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-muted-foreground">Annual Events & Holidays</label>
                                <Button
                                    variant="ghost" size="sm" className="h-6 text-xs"
                                    onClick={() => updateNewCalendar('recurringEvents', [...(newCalendar.recurringEvents || []), { id: Math.random().toString(), name: 'New Holiday', type: 'holiday', monthIndex: 0, day: 1 }])}
                                >
                                    <Plus className="h-3 w-3 mr-1" /> Add Event
                                </Button>
                            </div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                {(newCalendar.recurringEvents || []).map((event, idx) => (
                                    <div key={event.id || idx} className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-4">
                                            <Input
                                                value={event.name}
                                                onChange={(e) => {
                                                    const newEvents = [...(newCalendar.recurringEvents || [])];
                                                    newEvents[idx].name = e.target.value;
                                                    updateNewCalendar('recurringEvents', newEvents);
                                                }}
                                                className="h-8 text-sm"
                                                placeholder="Event Name"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <Select
                                                value={event.monthIndex.toString()}
                                                onValueChange={(v) => {
                                                    const newEvents = [...(newCalendar.recurringEvents || [])];
                                                    newEvents[idx].monthIndex = parseInt(v);
                                                    updateNewCalendar('recurringEvents', newEvents);
                                                }}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {newCalendar.months.map((m, mIdx) => (
                                                        <SelectItem key={mIdx} value={mIdx.toString()}>{m.name.substring(0, 3)}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                type="number"
                                                value={event.day}
                                                onChange={(e) => {
                                                    const newEvents = [...(newCalendar.recurringEvents || [])];
                                                    newEvents[idx].day = parseInt(e.target.value);
                                                    updateNewCalendar('recurringEvents', newEvents);
                                                }}
                                                className="h-8 text-sm font-mono"
                                                placeholder="Day"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Select
                                                value={event.type}
                                                onValueChange={(v: any) => {
                                                    const newEvents = [...(newCalendar.recurringEvents || [])];
                                                    newEvents[idx].type = v;
                                                    updateNewCalendar('recurringEvents', newEvents);
                                                }}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="holiday">Holiday</SelectItem>
                                                    <SelectItem value="season">Season</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <Button
                                                variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                onClick={() => {
                                                    const newEvents = (newCalendar.recurringEvents || []).filter((_, i) => i !== idx);
                                                    updateNewCalendar('recurringEvents', newEvents);
                                                }}
                                            >
                                                <Trash className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>


                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t">
                            <Button variant="outline" className="flex-1" onClick={() => setViewMode('timeline')}>
                                <X className="mr-2 h-4 w-4" /> Cancel
                            </Button>
                            <Button className="flex-1" onClick={handleSaveCalendar}>
                                <Save className="mr-2 h-4 w-4" /> Create System
                            </Button>
                        </div>
                    </div >
                ) : (
                    <>
                        {!selectedCalendar || !engine ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                                <div className="p-3 rounded-full bg-muted">
                                    <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">No active system</h3>
                                    <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">Select an existing system or create a new one to track time.</p>
                                </div>
                                <Button size="sm" onClick={() => setViewMode('create')}>
                                    <Plus className="h-4 w-4 mr-2" /> Create First System
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Date Navigation & Calendar Grid */}
                                <div className="flex flex-col gap-4 py-4 bg-card/40 rounded-xl border shadow-sm max-w-sm mx-auto w-full">
                                    {/* Header Controls */}
                                    <div className="flex items-center justify-between px-4">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                            const newMonth = currentDate.monthIndex - 1;
                                            if (newMonth < 0) {
                                                handleDateChange('year', currentDate.year - 1);
                                                handleDateChange('monthIndex', selectedCalendar.months.length - 1);
                                            } else {
                                                handleDateChange('monthIndex', newMonth);
                                            }
                                        }}>
                                            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                                        </Button>

                                        <div className="flex items-center gap-2">
                                            <Select
                                                value={currentDate.monthIndex.toString()}
                                                onValueChange={(v) => handleDateChange('monthIndex', parseInt(v))}
                                            >
                                                <SelectTrigger className="border-none shadow-none focus:ring-0 font-semibold h-8 bg-transparent hover:bg-accent/50 p-0 text-base gap-1 min-w-[fit-content]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {selectedCalendar.months.map((m, idx) => (
                                                        <SelectItem key={m.name || idx} value={idx.toString()}>
                                                            {m.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            <div className="flex items-center gap-0.5">
                                                <Input
                                                    type="number"
                                                    className="w-[60px] text-center font-bold border-none shadow-none focus-visible:ring-0 p-0 h-8 text-base bg-transparent hover:bg-accent/50 rounded-md transition-colors"
                                                    value={currentDate.year}
                                                    onChange={(e) => handleDateChange('year', parseInt(e.target.value) || 1)}
                                                />
                                                <span className="text-xs text-muted-foreground font-medium">{selectedCalendar.yearSuffix}</span>
                                            </div>
                                        </div>

                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                            const newMonth = currentDate.monthIndex + 1;
                                            if (newMonth >= selectedCalendar.months.length) {
                                                handleDateChange('year', currentDate.year + 1);
                                                handleDateChange('monthIndex', 0);
                                            } else {
                                                handleDateChange('monthIndex', newMonth);
                                            }
                                        }}>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </div>

                                    {/* Calendar Grid */}
                                    <div className="px-4 pb-2">
                                        {/* Weekday Header */}
                                        <div
                                            className="grid gap-1 mb-2 text-center"
                                            style={{ gridTemplateColumns: `repeat(${selectedCalendar.weekDays.length}, minmax(0, 1fr))` }}
                                        >
                                            {selectedCalendar.weekDays.map((d, i) => (
                                                <div key={i} className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate" title={d.name}>
                                                    {d.name.substring(0, 2)}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Days Grid */}
                                        <div
                                            className="grid gap-1 place-items-center"
                                            style={{ gridTemplateColumns: `repeat(${selectedCalendar.weekDays.length}, minmax(0, 1fr))` }}
                                        >
                                            {/* Empty Padding for Start of Month */}
                                            {Array.from({ length: engine.dateToAbsoluteDays({ year: currentDate.year, monthIndex: currentDate.monthIndex, day: 1 }) % selectedCalendar.weekDays.length }).map((_, i) => (
                                                <div key={`empty-${i}`} className="h-8 w-8" />
                                            ))}

                                            {/* Day Content */}
                                            {Array.from({ length: engine.getDaysInMonth(currentDate.monthIndex, currentDate.year) }).map((_, i) => {
                                                const dayNum = i + 1;
                                                const isSelected = dayNum === currentDate.day;

                                                // Find recurring events for this day
                                                const dayEvents = (selectedCalendar.recurringEvents || []).filter(
                                                    e => e.monthIndex === currentDate.monthIndex && e.day === dayNum
                                                );
                                                const hasEvent = dayEvents.length > 0;

                                                return (
                                                    <button
                                                        key={dayNum}
                                                        onClick={() => handleDateChange('day', dayNum)}
                                                        className={`
                                            relative h-8 w-8 text-sm font-medium rounded-md flex items-center justify-center transition-all
                                            ${isSelected
                                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                                : 'hover:bg-accent text-foreground'
                                                            }
                                            ${hasEvent && !isSelected ? 'font-semibold text-indigo-600 dark:text-indigo-400' : ''}
                                        `}
                                                    >
                                                        {dayNum}
                                                        {hasEvent && (
                                                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-current opacity-70" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Footer Info */}
                                    <div className="text-center border-t border-dashed pt-2 mx-4 pb-1">
                                        <span className="text-xs text-muted-foreground font-medium flex flex-col gap-0.5">
                                            <span>{engine.getDayOfWeek(currentDate)}</span>
                                            {(() => {
                                                const events = (selectedCalendar.recurringEvents || []).filter(
                                                    e => e.monthIndex === currentDate.monthIndex && e.day === currentDate.day
                                                );
                                                if (events.length > 0) {
                                                    return (
                                                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse">
                                                            {events.map(e => e.name).join(', ')}
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </span>
                                    </div>
                                </div>

                                {/* Add Event Section */}
                                <div className="rounded-lg border p-4 bg-card/50">
                                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                        <CalendarIcon className="h-4 w-4" /> Log New Event
                                    </h4>

                                    <div className="flex flex-col gap-3">
                                        <Input
                                            value={newEventTitle}
                                            onChange={(e) => setNewEventTitle(e.target.value)}
                                            placeholder="Event Title"
                                            className="h-9"
                                        />

                                        <Input
                                            value={newEventDescription}
                                            onChange={(e) => setNewEventDescription(e.target.value)}
                                            placeholder="Short description..."
                                            className="h-9"
                                        />

                                        {/* Days + Chapter Row */}
                                        <div className="flex flex-col md:flex-row gap-3 w-full">
                                            <div className="flex items-center gap-2 w-full">
                                                <Input
                                                    type="number"
                                                    value={newEventDuration}
                                                    onChange={(e) => setNewEventDuration(e.target.value)}
                                                    placeholder="Days"
                                                    className="h-9 font-mono w-full"
                                                />
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    days
                                                </span>
                                            </div>

                                            <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
                                                <SelectTrigger className="h-9 text-xs w-full">
                                                    <SelectValue placeholder="Link to Chapter" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">No Chapter</SelectItem>
                                                    {chapters.map((ch) => (
                                                        <SelectItem key={ch.id} value={ch.id}>
                                                            Ch {ch.order}: {ch.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <Button
                                            onClick={handleAddEvent}
                                            size="sm"
                                            className="w-full h-9"
                                            disabled={!newEventTitle}
                                        >
                                            Add to Timeline
                                        </Button>
                                    </div>
                                </div>

                                {/* Timeline Visualization */}
                                {events.length > 0 && (
                                    <div className="pt-2">
                                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                            Chronicle
                                        </h3>
                                        <div className="relative border-l-2 border-indigo-100 dark:border-indigo-900/50 ml-3 space-y-6 pb-2">
                                            {events.map((event) => {
                                                const linkedChapter = chapters.find(c => c.id === event.chapterId);
                                                return (
                                                    <div key={event.id} className="relative pl-6">
                                                        {/* Timeline Dot */}
                                                        <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-indigo-500 border-4 border-background shadow-sm" />

                                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 group">
                                                            <div className="flex-1 space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded">
                                                                        {engine.formatDate(event.startDate)}
                                                                    </span>
                                                                    {event.duration > 1 && (
                                                                        <span className="text-[10px] text-muted-foreground">
                                                                            — ends {engine.formatDate(event.endDate)}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-semibold text-foreground text-sm">{event.title}</h4>
                                                                    {linkedChapter && (
                                                                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-background">
                                                                            Ch {linkedChapter.order}
                                                                        </Badge>
                                                                    )}
                                                                </div>

                                                                {event.description && (
                                                                    <p className="text-sm text-muted-foreground/90 leading-relaxed">
                                                                        {event.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <Badge variant="secondary" className="w-fit text-[10px] whitespace-nowrap opacity-50 group-hover:opacity-100 transition-opacity">
                                                                {event.duration} {event.duration === 1 ? 'day' : 'days'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
