
/**
 * errorMiddleware.js - Garante que toda falha no Express seja JSON 100%
 */
export const errorHandler = (err, req, res, next) => {
    console.error(`[Global Error Handler] Capturado Erro:`, err.message);
    
    // Status default 500
    let statusCode = err.status || 500;
    
    // Identificar origem pela stack ou tipo do erro
    let source = 'backend';
    if (err.message.includes('query') || err.code) source = 'database';
    
    const errorBody = {
        success: false,
        error: err.message || 'Erro inesperado no servidor',
        detail: err.detail || err.hint || (process.env.NODE_ENV === 'development' ? err.stack : undefined),
        code: err.code || 'INTERNAL_ERROR',
        source: source,
        timestamp: new Date().toISOString(),
        path: req.path
    };

    res.status(statusCode).json(errorBody);
};
