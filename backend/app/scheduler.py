import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.scan import Scan
from app.models.scheduled_scan import ScheduledScan
from app.tasks.scan_runner import run_scan

scheduler = AsyncIOScheduler()

def run_scheduled_scans():
    db: Session = SessionLocal()
    try:
        now = datetime.datetime.utcnow()
        active_schedules = db.query(ScheduledScan).filter(ScheduledScan.is_active == True).all()
        
        for schedule in active_schedules:
            # Si nunca se ejecutó o ya pasó el intervalo
            if not schedule.last_run_at or (now - schedule.last_run_at).total_seconds() >= schedule.interval_hours * 3600:
                # Disparar un nuevo escaneo
                scan = Scan(
                    target=schedule.target,
                    status="pending",
                    created_at=datetime.datetime.utcnow(),
                )
                db.add(scan)
                db.commit()
                db.refresh(scan)
                
                # Ejecutar la tarea de fondo directamente en el orquestador
                # Como esto corre en el scheduler asíncrono, podríamos llamar a asyncio o pasarlo a un hilo
                # run_scan es síncrona en celery removal, así que la importaremos en un thread
                import threading
                threading.Thread(target=run_scan, args=(scan.id,)).start()
                
                # Actualizar último escaneo
                schedule.last_run_at = now
                db.commit()
    finally:
        db.close()

def start_scheduler():
    scheduler.add_job(run_scheduled_scans, 'interval', minutes=10) # Revisa cada 10 minutos
    scheduler.start()

def stop_scheduler():
    scheduler.shutdown()
