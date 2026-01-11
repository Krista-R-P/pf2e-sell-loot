// // Debug functionality for printing application data
// export function printDebugData(application) {
//     console.log(`%c🐛 DEBUG DATA for ${application.document.documentName}: ${application.document.name || application.document.id}`, 'color: yellow; background-color: black; font-weight: bold; padding: 2px 4px; border-radius: 3px;');
//     console.group(`Debug Data for ${application.document.documentName}: ${application.document.name || application.document.id}`);
//     console.log('Application:', application);
//     console.log('Document:', application.document);
//     console.log('Document Data:', application.document.system || application.document.data);
//     console.dir(application.document);
//     console.groupEnd();
    
//     ui.notifications.info(`Debug data printed to console for ${application.document.name || application.document.id}`);
// }