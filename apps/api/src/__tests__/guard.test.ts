import { describe, it, expect } from 'vitest'
import { checkContentSafety, quickSafetyCheck, preCheckUserInput } from '@masal-makinesi/prompts'

describe('Content Guard', () => {
    describe('checkContentSafety', () => {
        it('should pass safe content', () => {
            const safeContent = `Bir varmış bir yokmuş, güzel bir prenses varmış. Prenses bir günde ormanda geziniyordu ve çiçekler topluyordu. 
            Birden karşısına sevimli bir tavşan çıktı ve ona merhaba dedi. Prenses tavşanla arkadaş oldu ve birlikte güzel vakit geçirdiler. 
            Akşam olduğunda prenses eve döndü ve ailesine bu güzel gününü anlattı. Herkes çok mutlu oldu ve prenses o geceyı güzel rüyalarla geçirdi.
            Ertesi gün tekrar ormana gitti ve yeni maceralar yaşadı. Bu böyle devam etti ve prenses her gün mutlu oldu.`
            const result = checkContentSafety(safeContent)
            
            expect(result.safe).toBe(true)
            expect(result.confidence).toBeGreaterThan(0.5)
            expect(result.blockedTerms).toEqual([])
        })

        it('should block violent content', () => {
            const violentContent = 'şiddet ve kavga içeren hikaye'
            const result = checkContentSafety(violentContent)
            
            expect(result.safe).toBe(false)
            expect(result.blockedTerms).toContain('şiddet')
            expect(result.blockedTerms).toContain('kavga')
        })

        it('should block inappropriate terms', () => {
            const inappropriateContent = 'ölüm ve korku dolu hikaye'
            const result = checkContentSafety(inappropriateContent)
            
            expect(result.safe).toBe(false)
            expect(result.blockedTerms?.length).toBeGreaterThan(0)
        })

        it('should handle empty content', () => {
            const result = checkContentSafety('')
            
            expect(result.safe).toBe(false) // Empty content fails length check
            expect(result.blockedTerms).toEqual([])
        })

        it('should be case insensitive', () => {
            const mixedCaseContent = 'ŞİDDET ve KAVGA'
            const result = checkContentSafety(mixedCaseContent)
            
            expect(result.safe).toBe(false)
        })

        it('should detect excessive repetition', () => {
            const repetitiveContent = 'masal masal masal masal masal hikayesi'
            const result = checkContentSafety(repetitiveContent)
            
            expect(result.safe).toBe(false)
        })
    })

    describe('quickSafetyCheck', () => {
        it('should return true for safe content', () => {
            const safeContent = `Çok güzel bir hikaye anlatacağım size dostlarım çünkü bu keyifli olacak tabii ki. 
            Bu hikaye gerçekten hoş ve eğlenceli okumak için herkese çok öneriyorum dostlarıma.
            Kız çocuğu mutlu yaşadı ve iyi adam ile evlendi güzel bir tören düzenleyerek.
            Sonunda herkes mutlu oldu ve hoş günler geçirdiler birlikte evde huzur içinde.
            İnsanlar dans ettiler ve melodiler söylediler doğada yeşil ağaçların altında.
            Bu şekilde hikaye biter ve okuyucular memnun olarak gülerek dönerler evlerine.`
            
            expect(quickSafetyCheck(safeContent)).toBe(true)
        })

        it('should return false for blocked content', () => {
            const blockedContent = 'şiddet içerikli hikaye'
            expect(quickSafetyCheck(blockedContent)).toBe(false)
        })

        it('should handle multiple blocked terms', () => {
            const multipleBlocked = 'korku ve şiddet dolu hikaye'
            expect(quickSafetyCheck(multipleBlocked)).toBe(false)
        })
    })

    describe('preCheckUserInput', () => {
        it('should validate safe user input', () => {
            const safeInput = 'macera dolu hikaye'
            const result = preCheckUserInput(safeInput)
            
            expect(result.safe).toBe(true)
        })

        it('should block inappropriate user input', () => {
            const unsafeInput = 'şiddet ve korku'
            const result = preCheckUserInput(unsafeInput)
            
            expect(result.safe).toBe(false)
            expect(result.blockedTerms?.length).toBeGreaterThan(0)
        })

        it('should handle special characters and emojis', () => {
            const inputWithSpecial = 'güzel prenses 🌟 macera'
            const result = preCheckUserInput(inputWithSpecial)
            
            expect(result.safe).toBe(true)
        })
    })
}) 